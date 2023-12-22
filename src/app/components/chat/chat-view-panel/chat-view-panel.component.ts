import {
  Component,
  DestroyRef,
  ElementRef, EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {Chat, ChatType, UserChat} from "../../../models/chat/chat";
import {ChatService} from "../../../services/chat/chat.service";
import {ChatMessage} from "../../../models/chat/chat-message";
import {AuthService} from "../../../services/auth/auth.service";
import {SendChatMessageRequestDto} from "../../../models/chat/send-chat-message-dto";
import {
  catchError,
  debounceTime,
  EMPTY,
  filter,
  first, firstValueFrom,
  fromEvent,
  lastValueFrom,
  map,
  of,
  pairwise,
  ReplaySubject,
  Subject,
  takeUntil,
  tap
} from "rxjs";
import {EmojiComponent} from "@ctrl/ngx-emoji-mart/ngx-emoji";
import {Menu} from "primeng/menu";
import {DialogService} from "primeng/dynamicdialog";
import {ChatPickerModalComponent} from "../chat-picker-modal/chat-picker-modal.component";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {ConfirmationModalComponent} from "../../confirmation-modal/confirmation-modal.component";
import {ModalService} from "../../../services/modal.service";

@Component({
  selector: 'app-chat-view-panel',
  templateUrl: './chat-view-panel.component.html',
  styleUrls: ['./chat-view-panel.component.scss'],
})
export class ChatViewPanelComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('messageInput') messageInput!: ElementRef;
  @ViewChild('emojiPicker') emojiPicker!: EmojiComponent;
  @ViewChild('headerMenu') headerMenu!: Menu;

  @Input({ required: true }) public chat!: Chat;

  protected messageInputValue$: Subject<string> = <Subject<string>>(new Subject<string>)
    .pipe(
      tap(value => {
        this.messageInputValue = value;
      }),
      takeUntilDestroyed(this.destroyRef),
    );

  protected messageInputValue: string = '';
  protected emojiInputValue$: Subject<string> = new Subject<string>;

  protected isSelectionModeOn: boolean = false;

  private _chatChanged$: ReplaySubject<void> = new ReplaySubject<void>(1);

  protected selectedMessages!: Set<ChatMessage>;

  protected selectedMessagesCanForwardAmount: number = 0;
  protected selectedMessagesCanDeleteAmount: number = 0;

  protected chatStatusText: string = '';

  protected inputPickedFiles: Subject<FileList> = new Subject<FileList>();

  constructor(
    protected chatService: ChatService,
    private authService: AuthService,
    private modalService: ModalService,
    private destroyRef: DestroyRef,
  ) {

  }

  ngOnInit() {
    this.emojiInputValue$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(next => {
        this.messageInputValue += next;
      });

    this.chatService.selectedMessages$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(messages => {
        this.selectedMessages = messages;

        this.selectedMessagesCanDeleteAmount = 0;
        this.selectedMessagesCanForwardAmount = 0;

        if (messages.size > 0) {
          this.isSelectionModeOn = true;

          this.selectedMessages.forEach(x => {
            if (x.canBeDeleted) {
              this.selectedMessagesCanDeleteAmount++;
            }

            if (x.canBeForwarded) {
              this.selectedMessagesCanForwardAmount++;
            }
          });
        } else {
          this.isSelectionModeOn = false;
        }
      });

    this.messageInputValue$.pipe(
      tap(x => {
        if (this.chat.messagesToEdit$.value)
          return;

        this.chatService.activeChatIsTyping$.next(true);
      }),
      debounceTime(1_500),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(x => {
      this.chatService.activeChatIsTyping$.next(false);
    });

    fromEvent(document.body, 'dragenter')
      .pipe(
        map(event => <DragEvent>event),
        filter(event => !event.relatedTarget),
        filter(event => {
          if (!event.dataTransfer || !event.dataTransfer.items || event.dataTransfer.items)
            return false;

          return true;
        }),
        map(event => event.dataTransfer!.items),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(event => {
        let leaveSub = fromEvent(document.body, 'dragleave')
          .pipe(
            map(event => <DragEvent>event),
            filter(event => !event.relatedTarget),
            first(),
            takeUntilDestroyed(this.destroyRef),
          )
          .subscribe(event => {
            dropSub.unsubscribe();
          });

        let dropSub = fromEvent(document.body, 'drop')
          .pipe(
            map(event => <DragEvent>event),
            filter(event => !event.relatedTarget),
            first(),
            takeUntilDestroyed(this.destroyRef),
          )
          .subscribe(event => {
            event.preventDefault();

            leaveSub.unsubscribe();

            this.inputPickedFiles.next(event.dataTransfer!.files);
          });
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['chat']) {
      const prevChat = changes['chat'].previousValue as (Chat | undefined);
      const actualChat = changes['chat'].currentValue as Chat;

      if (prevChat && prevChat.id === actualChat.id)
        return;

      this._chatChanged$.next();
      this._chatChanged$.complete();

      this._chatChanged$ = new ReplaySubject<void>(1);

      this.chat.messagesToEdit$
        .pipe(
          pairwise(),
          takeUntil(this._chatChanged$),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(([oldResult, result]) => {
          if (result) {
            if (oldResult) {
              this.resetInputValue();
            }

            this.chat.lastMessageInputValue = this.messageInputValue;

            if (result.editType === 'edit') {
              this.messageInputValue = result.messages[0].content;
            } else {
              this.messageInputValue = '';
            }

            this.focusInput();
          } else {
            this.resetInputValue();
          }
        });

      if (this.chat instanceof UserChat) {
        this.chat.membersTyping$
          .pipe(
            takeUntil(this._chatChanged$),
            takeUntilDestroyed(this.destroyRef),
          )
          .subscribe(value => {
            if (value.length > 0) {
              this.chatStatusText = `is typing...`;
            } else {
              this.chatStatusText = "last seen a long time ago";
            }
        });
      }

      const currentMessageInputValue = this.messageInputValue;

      if (this.chat.lastMessageInputValue) {
        this.messageInputValue = this.chat.lastMessageInputValue;
      } else {
        this.messageInputValue = '';
      }

      if (prevChat && currentMessageInputValue.length > 0) {
        prevChat.lastMessageInputValue = currentMessageInputValue;
      }
    }
  }

  ngAfterViewInit() {

  }

  ngOnDestroy() {

  }

  sendMessageBtnClick() {
    if (this.chat.messagesToEdit$.value?.editType === 'edit') {
      const message = this.chat.messagesToEdit$.value!;

      let content = this.messageInputValue;

      content = this.preprocessMessageContent(content);

      if (content.length == 0) {
        this.showDeleteMessagesConfirmDialog([message.messages[0]]);
      } else {
        this.chatService.editMessage({
          chatId: this.chat.id,
          messageId: message.messages[0].id,
          content: content,
        }).subscribe(x => {
          this.chat.messagesToEdit$.next(undefined);
        });
      }
    } else {
      this.sendMessage();
    }
  }

  protected selectionModeCancel() {
    this.chatService.clearSelectedMessages();
  }

  protected selectionModeDeleteSelected() {
    const messages = [...this.selectedMessages].filter(x => x.canBeDeleted);

    if (messages.length === 0)
      return;

    this.showDeleteMessagesConfirmDialog(messages);
  }

  protected selectionModeForwardSelected() {
    const messages = [...this.selectedMessages].filter(x => x.canBeForwarded);

    if (messages.length === 0)
      return;

    this.forwardMessages(messages);
  }

  protected headerMenuBtnClicked(event: MouseEvent) {
    this.headerMenu.model = [
      {
        id: 'viewProfile',
        label: 'View profile',
        icon: 'pi pi-fw pi-user',

        command: () => {
          this.headerClick();
        },
      },
    ];

    this.headerMenu.toggle(event);
  }

  protected headerSearchBtnClicked(event: MouseEvent) {
    this.chatService.searchInChat$.next(this.chat);
  }

  protected onCancelEditBtnPressed() {
    if (this.chat.messagesToEdit$.value) {
      this.chat.messagesToEdit$.next(undefined);
    }
  }

  protected async onEditMessagePressed() {
    const messagesToEdit = await lastValueFrom(this.chat.messagesToEdit$.pipe(first()));

    if (!messagesToEdit)
      return;

    if (messagesToEdit.editType === 'forward') {
      this.forwardMessages(messagesToEdit.messages);
    } else {
      this.chatService.jumpToMessage(messagesToEdit.messages[0].id, 'center', true)
        .subscribe();
    }
  }

  protected onMessageInputKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      if (event.shiftKey) {
        event.preventDefault();

        this.sendMessageBtnClick();
      }
    } else if (event.key == "ArrowUp") {
      if (this.messageInputValue.length === 0 && !this.chat.messagesToEdit$.value) {
        let message = [...this.chat.messages].reverse().find(x => x.canBeEdited);

        if (message) {
          this.chat.messagesToEdit$.next({ chat: this.chat, messages: [message], editType: 'edit', });
        }
      }
    }
  }

  protected async sendMessage() {
    let content = this.messageInputValue;

    content = this.preprocessMessageContent(content);

    if (content.length == 0)
      return;

    if (this.chat.id.startsWith('temp') && this.chat instanceof UserChat) {
      await firstValueFrom(this.chatService.createChat({ chatType: ChatType.User, memberIds: [this.chat.member.id], }));
    }

    const dto: SendChatMessageRequestDto = {
      chatId: this.chat.id,

      content: content,
    };

    let quotedMessage: ChatMessage | undefined;

    const messagesToEdit = this.chat.messagesToEdit$.value;

    if (messagesToEdit) {
      if (messagesToEdit.editType === 'reply') {
        quotedMessage = messagesToEdit.messages[0];

        dto.quotedMessageId = quotedMessage.id;
      } else if (messagesToEdit.editType === 'forward') {
        dto.sourceChatId = messagesToEdit.chat.id;

        dto.forwardedMessages = messagesToEdit.messages.map(message => message.id);
      }

      this.chat.messagesToEdit$.next(undefined);
    }

    this.messageInputValue = '';

    this.chatService.sendMessage(dto).pipe(
    ).subscribe(next => {

    });
  }

  protected preprocessMessageContent(str: string) {
    str = str.trim();

    return str;
  }

  protected showDeleteMessagesConfirmDialog(messages: ChatMessage[]) {
    let message: string;

    if (messages.length === 1)
      message = `Are you sure that you want to delete this message?`;
    else
      message = `Are you sure that you want to delete ${messages.length} messages?`;

    const accept = new EventEmitter<void>();
    const reject = new EventEmitter<{ onClose: boolean, }>();

    const ref = this.modalService.open(ConfirmationModalComponent, {
      dismissableMask: true,
      showHeader: false,

      data: {
        accept: accept, reject: reject,
      },
    });

    ref.setInput('text', message);
    ref.setInput('closeOnClick', true);

    accept.subscribe(() => {
      let t = { messageIds: messages.map(x => x.id), };

      this.chatService.deleteMessages({ chatId: this.chat.id, messageIds: messages.map(x => x.id), })
        .pipe(
          catchError((err, caught) => {
            return EMPTY;
          }),
        )
        .subscribe();
    });
  }

  protected replyToMessage(message: ChatMessage) {
    this.chat.messagesToEdit$.next({ chat: this.chat, messages: [message], editType: 'reply', });
  }

  protected editMessage(message: ChatMessage) {
    this.chat.messagesToEdit$.next({ chat: this.chat, messages: [message], editType: 'edit', });
  }

  copyMessages(messages: ChatMessage[]) {
    of(navigator.clipboard.writeText(messages[0].content)).subscribe();
  }

  focusInput() {
    this.messageInput.nativeElement.focus();
  }

  headerClick() {
    if (this.chat instanceof UserChat) {
      this.chatService.setActiveChatMemberProfile(this.chat.member);
    }
  }

  resetInputValue() {
    if (this.chat.lastMessageInputValue) {
      this.messageInputValue = this.chat.lastMessageInputValue;
    } else {
      this.messageInputValue = "";
    }
  }

  onInput(event: any) {
    this.messageInput.nativeElement.style.height = '';
    this.messageInput.nativeElement.style.height = `${this.messageInput.nativeElement.scrollHeight}px`;
  }

  attachFilesBtnClicked(event: MouseEvent) {
    document.getElementById('chat-input-attach-input')!.click();
  }

  forwardMessages(messages: ChatMessage[]) {
    const currentChat = this.chat;

    let chatPicked = new EventEmitter<{ chatId: string, }>;

    const ref = this.modalService.open(ChatPickerModalComponent, {
      dismissableMask: true,
      showHeader: false,

      data: {
        chatPicked: chatPicked,
      }
    });

    ref.setInput('headerTitleText', 'Forward messages...');

    const chatPickedSub = chatPicked.subscribe(value => {
      const targetChat = this.chatService.getChatById(value.chatId);

      if (targetChat) {
        if (this.chatService.setActiveChat(targetChat)) {
          if (targetChat.id === currentChat.id) {
            this.selectionModeCancel();
          } else {
            if (currentChat.messagesToEdit$.value?.editType === 'forward') {
              currentChat.messagesToEdit$.next(undefined);
            }
          }

          targetChat.messagesToEdit$.next({ chat: this.chat, messages: messages, editType: 'forward', });

          ref.close();
        }
      }
    });

    const messageDeletedSub = this.chat.messageDeleted$
      .pipe(
        filter(value => messages.some(message => message.id === value.id))
      )
      .subscribe(value => {
        ref.close();
      });

    ref.onClose.subscribe(value => {
      messageDeletedSub.unsubscribe();
    });
  }
}
