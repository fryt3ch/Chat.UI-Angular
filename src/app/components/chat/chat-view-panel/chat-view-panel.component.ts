import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {Chat} from "../../../models/chat/chat";
import {InputTextarea} from "primeng/inputtextarea";
import {ChatService} from "../../../services/chat/chat.service";
import {ChatMessage} from "../../../models/chat/chat-message";
import {CdkVirtualScrollViewport } from "@angular/cdk/scrolling";
import {AuthService} from "../../../services/auth/auth.service";
import {SendChatMessageRequestDto} from "../../../models/chat/send-chat-message-dto";
import {
  BehaviorSubject,
  debounceTime,
  filter,
  fromEvent,
  Observable, of,
  ReplaySubject,
  Subject,
  takeUntil,
  tap
} from "rxjs";
import {ContextMenu} from "primeng/contextmenu";
import {EmojiComponent, EmojiEvent} from "@ctrl/ngx-emoji-mart/ngx-emoji";
import {Menu} from "primeng/menu";
import {ConfirmationService, ConfirmEventType} from "primeng/api";

@Component({
  selector: 'app-chat-view-panel',
  templateUrl: './chat-view-panel.component.html',
  styleUrls: ['./chat-view-panel.component.scss'],
  providers: [ConfirmationService],
})
export class ChatViewPanelComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('messageInput') messageInput!: InputTextarea;
  @ViewChild('emojiPicker') emojiPicker!: EmojiComponent;
  @ViewChild('messagesScrollViewport') messagesScrollViewport!: CdkVirtualScrollViewport;
  @ViewChild('chatMessageContextMenu') chatMessageContextMenu!: ContextMenu;
  @ViewChild('headerMenu') headerMenu!: Menu;

  @Input({ required: true, }) public chat!: Chat;

  protected messageInputModel$: ReplaySubject<string> = new ReplaySubject<string>(1);
  protected messageInputValue: string = '';
  protected emojiInputValue$: Subject<string> = new Subject<string>;

  protected readonly selectedMessages: Set<ChatMessage> = new Set<ChatMessage>();
  protected readonly messageSelected$: ReplaySubject<ChatMessage> = new ReplaySubject<ChatMessage>(1);
  protected readonly messageUnselected$: ReplaySubject<ChatMessage> = new ReplaySubject<ChatMessage>(1);

  private messagesPreloaded: boolean = false;

  private loadMessagesAmount: number = 25;

  protected isSelectionModeOn: boolean = false;

  private readonly _destroy$ = new Subject<void>();

  constructor(private chatService: ChatService, private authService: AuthService, private confirmationService: ConfirmationService) {
    console.log("constr");
  }

  ngOnInit() {
    this.emojiInputValue$.pipe(takeUntil(this._destroy$)).subscribe(next => {
      this.messageInputValue += next;
    });

    this.chatService.newMessage$.pipe(takeUntil(this._destroy$)).subscribe((x) => {
      if (x.chat != this.chat)
        return;

      if (this.messagesScrollViewport.measureScrollOffset("bottom") == 0) {
        setTimeout(() => {
          this.messagesScrollViewport.scrollToIndex(this.chat.messages.length, "smooth");
        }, 0)
      }
    });

    this.chatService.deletedMessage$.pipe(
        takeUntil(this._destroy$),
        filter((x) => {
          if (x.chat != this.chat)
            return false;

          return true;
        })
    ).subscribe(message => {
      this.removeMessageFromSelected(message);
    });

    this.messageSelected$.pipe(takeUntil(this._destroy$)).subscribe(message => {
      if (!this.isSelectionModeOn)
        this.isSelectionModeOn = true;

      console.log('Selected', message.id);
    });

    this.messageUnselected$.pipe(takeUntil(this._destroy$)).subscribe(message => {
      if (this.isSelectionModeOn && this.selectedMessages.size == 0)
        this.isSelectionModeOn = false;

      console.log('Unselected', message.id);
    });

    this.chat.messageToEdit$.pipe(takeUntil(this._destroy$)).subscribe(next => {
      if (next) {
        this.chat.lastMessageInputValue = this.messageInputValue;

        this.messageInputValue = this.chat.messageToEdit$.value!.content;
      } else {
        if (this.chat.lastMessageInputValue) {
          this.messageInputValue = this.chat.lastMessageInputValue;
        } else {
          this.messageInputValue = "";
        }
      }
    });

    this.messageInputModel$.pipe(takeUntil(this._destroy$)).subscribe(x => {
      this.messageInputValue = x;
    });

    this.messageInputModel$.pipe(
        tap(x => {
          if (this.chat.messageToEdit$.value)
            return;

          this.chatService.selectedChatIsTyping$.next(true);
        }),
        debounceTime(1_500),
        takeUntil(this._destroy$),
    ).subscribe(x => {
      this.chatService.selectedChatIsTyping$.next(false);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log("change")

    console.log(this.chat.id);

    const currentMessageInputValue = this.messageInputValue;

    if (this.chat.lastMessageInputValue) {
      this.messageInputValue = this.chat.lastMessageInputValue;
    } else {
      this.messageInputValue = '';
    }

    if (changes["chat"].previousValue as Chat && currentMessageInputValue.length > 0) {
      changes["chat"].previousValue.chatLastMessageInputValue = currentMessageInputValue;
    }

    if (!this.messagesPreloaded) {
      this.chatService.getChatMessages(this.chat, { offset: this.chat.messages.length, count: this.loadMessagesAmount, })
          .pipe(

          ).subscribe(next => {
        if (next.length === 0) {

        } else {
          this.chat.addMessages(next.reverse(), true);
        }

        setTimeout(() => {
          if (this.chat.lastMessageIdx >= 0)
            this.messagesScrollViewport.scrollToIndex(this.chat.lastMessageIdx, "instant");
          else
            this.messagesScrollViewport.scrollToIndex(this.chat.messages.length, "instant");
        }, 0);

        this.messagesPreloaded = true;
      });
    } else {
      setTimeout(() => {
        if (this.chat.lastMessageIdx >= 0)
          this.messagesScrollViewport.scrollToIndex(this.chat.lastMessageIdx, "instant");
        else
          this.messagesScrollViewport.scrollToIndex(this.chat.messages.length, "instant");
      }, 0);
    }
  }

  ngAfterViewInit() {

  }

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
  }

  sendMessageBtnClick() {
    if (this.chat.messageToEdit$.value) {
      const message = this.chat.messageToEdit$.value;

      let content = this.messageInputValue;

      content = this.preprocessMessageContent(content);

      if (content.length == 0) {
        this.showDeleteMessagesConfirmDialog([message]);
      } else {
        this.chatService.editMessage(this.chat.id, message.id, {
          content: content,
        }).subscribe(x => {
          this.chat.messageToEdit$.next(undefined);
        });
      }

    } else if (this.chat.messageToReply$.value) {

    } else {
      this.sendMessage();
    }
  }

  protected scrolledIndexChange(idx: number) {
    if (!this.messagesPreloaded)
      return;

    console.log(idx);

    if (idx == 0) {
      this.chatService.getChatMessages(this.chat, { offset: this.chat.messages.length, count: this.loadMessagesAmount, })
          .pipe(

          ).subscribe(next => {
        if (next.length === 0) {

        } else {
          this.chat.addMessages(next.reverse(), true);

          setTimeout(() => {
            this.messagesScrollViewport.scrollToIndex(next.length, "instant");
          }, 0);
        }
      });
    }
  }

  protected selectionModeCancel() {
    this.selectedMessages.forEach(x => {
      this.removeMessageFromSelected(x);
    });
  }

  protected selectionModeDeleteSelected() {
    if (this.selectedMessages.size === 0)
      return;

    this.showDeleteMessagesConfirmDialog([...this.selectedMessages]);
  }

  protected scrollToMessage(message: ChatMessage) {
    const idx = this.chat.messages.findIndex(x => x == message);

    if (idx < 0)
      return;

    this.messagesScrollViewport.scrollToIndex(idx, "instant");
  }

  protected onHeaderMenuBtnClick(event: MouseEvent) {
    this.headerMenu.model = [
      {
        id: 'reply',
        label: 'Reply',
        icon: 'pi pi-fw pi-reply',
        iconStyle: { 'transform': 'scaleX(-1.0)', },
      },
    ];

    this.headerMenu.toggle(event);
  }

  protected onCancelEditBtnPressed() {
    if (this.chat.messageToEdit$.value) {
      this.chat.messageToEdit$.next(undefined);
    }
  }

  protected onMessageInputKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      if (event.shiftKey) {
        event.preventDefault();

        this.sendMessageBtnClick();
      }
    } else if (event.key == "ArrowUp") {
      if (this.messageInputValue.length === 0 && !this.chat.messageToReply$.value && !this.chat.messageToEdit$.value) {
        let message = [...this.chat.messages].reverse().find(x => x.userId == this.authService.user!.id);

        if (message) {
          this.chat.messageToEdit$.next(message);
        }
      }
    }
  }

  protected sendMessage() {
    let content = this.messageInputValue;

    content = this.preprocessMessageContent(content);

    if (content.length == 0)
      return;

    const dto: SendChatMessageRequestDto = {
      content: content,
    };

    this.chatService.sendMessage(this.chat.id, dto).pipe(
    ).subscribe(next => {
      this.messageInputValue = '';
    });
  }

  protected preprocessMessageContent(str: string) {
    str = str.trim();

    return str;
  }

  protected showDeleteMessagesConfirmDialog(messages: ChatMessage[]) {
    this.confirmationService.confirm({
      message: messages.length == 1 ? `Are you sure that you want to delete this message?` : `Are you sure that you want to delete ${messages.length} messages?`,
      icon: 'pi pi-trash',
      accept: () => {
        console.log('accept');

        this.chatService.deleteMessages(this.chat.id, { messageIds: messages.map(x => x.id), })
            .subscribe();
      },
      reject: (type: ConfirmEventType) => {

      }
    });
  }

  addMessageToSelected(message: ChatMessage) {
    if (this.selectedMessages.has(message))
      return;

    this.selectedMessages.add(message);
    this.messageSelected$.next(message);
  }

  removeMessageFromSelected(message: ChatMessage) {
    if (this.selectedMessages.delete(message)) {
      this.messageUnselected$.next(message);
    }
  }

  copyMessages(messages: ChatMessage[]) {
    of(navigator.clipboard.writeText(messages[0].content)).subscribe();
  }

  onShowContextMenu() {
    console.log('asd')
  }
}
