import {Injectable} from '@angular/core';
import * as signalR from "@microsoft/signalr";
import {HttpClient, HttpParams} from "@angular/common/http";
import {
  BehaviorSubject,
  catchError,
  delay,
  distinctUntilChanged,
  EMPTY,
  filter,
  from,
  map,
  Observable,
  ReplaySubject,
  skip,
  Subject,
  take,
  takeUntil,
  takeWhile,
  tap,
  timer
} from "rxjs";
import {ApiResult, ApiResultWithData} from "../../models/common/api-result";
import {Chat, ChatType, MessageSetType, UserChat} from "../../models/chat/chat";
import {GetChatMessagesDto, GetChatMessagesRequestDto} from "../../models/chat/get-chat-messages-dto";
import {ChatMessage} from "../../models/chat/chat-message";
import {UserProfileService} from "../user-profile/user-profile.service";
import {ChatUserTypingState} from "../../models/chat/chat-user-typing-state.enum";
import {SetUserTypingStateDto, SetUserTypingStateRequestDto} from "../../models/chat/set-user-typing-state-dto";
import {DeleteChatMessagesDto, DeleteChatMessagesRequestDto} from "../../models/chat/delete-chat-messages-dto";
import {SendChatMessageDto, SendChatMessageRequestDto} from "../../models/chat/send-chat-message-dto";
import {GetChatsRequestDto} from "../../models/chat/get-chats-dto";
import {EditChatMessageDto, EditChatMessageRequestDto} from "../../models/chat/edit-chat-message-dto";
import {ContextMenu} from "primeng/contextmenu";
import {ChatReadDto, ChatReadRequestDto} from "../../models/chat/chat-read-dto";
import {DialogService, DynamicDialogRef} from "primeng/dynamicdialog";
import {
  ChatMemberProfileModalComponent
} from "../../components/chat/chat-member-profile-modal/chat-member-profile-modal.component";
import {UserProfile} from "../../models/user-profile/user-profile";
import {ChatDtoBase} from "../../models/chat/chat-dto";
import {ChatNewDto} from "../../models/chat/chat-new-dto";
import {CreateChatDto, CreateChatRequestDto} from "../../models/chat/create-chat-dto";
import {ChatDeletedDto, DeleteChatRequestDto} from "../../models/chat/delete-chat-dto";
import {ChatClearedDto, ClearChatRequestDto} from "../../models/chat/clear-chat-dto";
import {ChatHubService} from "./chat-hub.service";
import {ModalRef, ModalService} from "../modal.service";

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly _chats$: ReplaySubject<Chat[]> = new ReplaySubject<Chat[]>(1);

  private _chats: Chat[] = [];

  private readonly _messageNew$: Subject<{ chat: Chat, message: ChatMessage, }> = new Subject();
  private readonly _messageDeleted$: Subject<{ chat: Chat, message: ChatMessage, }> = new Subject();
  private readonly _messageEdited$: Subject<{ chat: Chat, message: ChatMessage, }> = new Subject();
  private readonly _memberTypingState$: Subject<{ member: UserProfile, chat: Chat, typingState: ChatUserTypingState, }> = new Subject();

  private readonly _chatRead$: Subject<{ chatId: string, lastReadMessageSentAt: Date, unreadMessagesAmount: number, }> = new Subject();

  private readonly _activeChatMemberProfile$: BehaviorSubject<UserProfile | undefined> = new BehaviorSubject<UserProfile | undefined>(undefined);
  private readonly _activeChat$: BehaviorSubject<Chat | undefined> = new BehaviorSubject<Chat | undefined>(undefined);
  private readonly _activeChatMessages$: BehaviorSubject<ChatMessage[]> = new BehaviorSubject<ChatMessage[]>([]);
  private readonly _jumpToMessage$ = new Subject<{ messageId: string | 'latest', position: 'start' | 'center' | 'end', highlight: boolean, }>;
  private readonly _selectedMessages$: BehaviorSubject<Set<ChatMessage>> = new BehaviorSubject<Set<ChatMessage>>(new Set());

  private _activeChatChanged: ReplaySubject<void> = new ReplaySubject<void>(1);

  public readonly activeChatIsTyping$: BehaviorSubject<boolean> = <BehaviorSubject<boolean>>(new BehaviorSubject<boolean>(false)).pipe(
      distinctUntilChanged(),
  );

  public readonly chats$: Observable<Chat[]> = this._chats$.asObservable();
  public readonly messageNew$ = this._messageNew$.asObservable();
  public readonly messageEdited$ = this._messageEdited$.asObservable();
  public readonly messageDeleted$ = this._messageDeleted$.asObservable();
  public readonly activeChatMemberProfile$: Observable<UserProfile | undefined> = this._activeChatMemberProfile$.asObservable();
  public readonly activeChat$: Observable<Chat | undefined> = this._activeChat$.asObservable();
  public readonly activeChatMessages$: Observable<ChatMessage[]> = this._activeChatMessages$.asObservable();
  public readonly jumpToMessage$ = this._jumpToMessage$.asObservable();
  public readonly selectedMessages$ = this._selectedMessages$.asObservable();
  public readonly memberTypingState$ = this._memberTypingState$.asObservable();

  public readonly searchInChat$ = new Subject<Chat>();

  public readonly chatRead$ = this._chatRead$.asObservable();

  public contextMenuElement!: ContextMenu;

  constructor(
    private httpClient: HttpClient,
    public chatHubService: ChatHubService,
    public userProfileService: UserProfileService,
    private modalService: ModalService,
  ) {
    this.chatHubService.messageNew$
      .subscribe(dto => {
        dto.messages.forEach(messageDto => {
          const chat = this.getChatById(messageDto.chatId);

          if (!chat) {
            return;
          }

          const message = ChatMessage.fromDto(messageDto, this);

          chat.addMessageSorted(message, message.isSenderMe, true);

          this._messageNew$.next({ chat: chat, message: message, });
        });
    });

    this.chatHubService.messageEdited$
      .subscribe(dto => {
        const chat = this.getChatById(dto.chatId);

        if (!chat) {
          return;
        }

        const message = ChatMessage.fromDto(dto.messageDto, this);

        chat.addMessageSorted(message, false, false);

        this._messageEdited$.next({ chat: chat, message: message, });
      });

    this.chatHubService.messagesDeleted$
      .subscribe(dto => {
        const chat = this.getChatById(dto.chatId);

        if (!chat)
          return;

        dto.messages.forEach(messageId => {
          const removeResult = chat.removeMessage(messageId, undefined);

          if (removeResult) {
            this._messageDeleted$.next({ chat: chat, message: removeResult.message, });
          }
        });
      });

    this.chatHubService.chatRead$
      .subscribe(dto => {
        this._chatRead$.next({ chatId: dto.chatId, lastReadMessageSentAt: new Date(dto.lastReadMessageSentAt), unreadMessagesAmount: dto.unreadMessagesAmount, });
      });

    this.chatHubService.chatTypingState$
      .subscribe(dto => {
        const chat = this.getChatById(dto.chatId);

        if (!chat) {
          return;
        }

        const member = chat.members.find(x => x.id == dto.userId);

        if (!member) {
          return;
        }

        this._memberTypingState$.next({ member: member, chat: chat, typingState: dto.state, });
      });

    this.chatHubService.chatNew$
      .subscribe(dto => {
        const chat = Chat.fromDto(dto.chat, this);

        this._addChat(chat);
      });

    this.chatHubService.chatCleared$
      .subscribe(dto => {
        const chat = this.getChatById(dto.chatId);

        if (chat) {
          chat.clear();

          if (this._activeChat$.value?.id === chat.id) {
            this._activeChatMessages$.next([...chat.messages]);
          }
        }
      });

    this.chatHubService.chatDeleted$
      .subscribe(dto => {
        const chat = this.getChatById(dto.chatId);

        if (chat) {
          this._removeChat(chat, true);
        }
      });

    this.activeChatIsTyping$.subscribe(x => {
      const chat = this._activeChat$.value;

      if (!chat)
        return;

      const dto: SetUserTypingStateRequestDto = {
        chatId: chat.id,
        state: x ? ChatUserTypingState.Typing : ChatUserTypingState.None,
      };

      //console.log(x);

      this.setChatUserTypingState(dto)
          .subscribe();
    });

    this.chatHubService.connectionStatus$
      .pipe(delay(1_000), filter(x => x === 'disconnected'))
      .subscribe(x => {
        this.chatHubService.startConnection();
      });

    this.chatHubService.connectionStatus$.pipe(filter(x => x === 'connected'), take(1))
      .subscribe(x => {
        console.log("SignalR connected!");

        let getChatPreviewsDto: GetChatsRequestDto = {
          offset: 0,
          count: 0,
        }

        this.getChats(getChatPreviewsDto).pipe(
          tap(chatPreviews => {

          })
        ).subscribe(chats => {
          if (chats.length === 0) {
            this._chats$.next(this._chats);

            return;
          } else {
            chats.forEach(x => {
              let chat = Chat.fromDto(x, this);

              this._addChat(chat);

              chat.latestMessage$.pipe(skip(1)).subscribe(latestMessage => {
                this._orderChats();
              });
            });
          }
        });
      });

    this.chatHubService.connectionStatus$.subscribe(console.log);
  }

  public sendMessage(dto: SendChatMessageRequestDto) {
    return this.chatHubService.invoke<ApiResult>('message.send', dto);
  }

  public editMessage(dto: EditChatMessageRequestDto) {
    return this.chatHubService.invoke<ApiResult>('message.edit', dto);
  }

  public pinMessage(chatId: string, messageId: string) {
    return this.httpClient.post(`/api/chat/${chatId}/message/${messageId}/pin`, undefined, { withCredentials: true, });
  }

  public unpinMessage(chatId: string, messageId: string) {
    return this.httpClient.delete(`/api/chat/${chatId}/message/${messageId}/pin`, { withCredentials: true, });
  }

  public deleteMessages(dto: DeleteChatMessagesRequestDto) {
    return this.chatHubService.invoke<ApiResult>('messages.delete', dto);
  }

  public getChatMessages(dto: GetChatMessagesRequestDto) {
    return this.chatHubService.invoke<ApiResultWithData<GetChatMessagesDto>>('messages.get', dto)
      .pipe(
        map(x => x.data)
      );
  }

  public getChatPinnedMessages(chat: Chat, dto: GetChatMessagesRequestDto, messageSetToAddToIfDoesNotExist: MessageSetType = 'current') {
    return this.httpClient.get<ApiResultWithData<GetChatMessagesDto>>(`/api/chat/${chat.id}/messages/pinned`, { withCredentials: true, params: new HttpParams({ fromObject: dto as any, }) })
      .pipe(
        map(value => value.data.messages.map(x => ChatMessage.fromDto(x, this))),
        tap(messages => {
          console.log(messages);
        }),
      );
  }

  public createChat(dto: CreateChatRequestDto) {
    return this.chatHubService.invoke<ApiResultWithData<CreateChatDto>>('chat.create', dto)
      .pipe(
        map(value => value.data)
      );
  }

  public deleteChat(dto: DeleteChatRequestDto) {
    return this.chatHubService.invoke<ApiResult>('chat.delete', dto);
  }

  public clearChat(dto: ClearChatRequestDto) {
    return this.chatHubService.invoke<ApiResult>('chat.clear', dto);
  }

  public getChats(dto: GetChatsRequestDto) {
    return this.chatHubService.invoke<ApiResultWithData<ChatDtoBase[]>>('chats.get', dto)
      .pipe(
        map(value => value.data)
      );
  }

  public readChat(dto: ChatReadRequestDto) {
    return this.chatHubService.invoke<ApiResult>('chat.read', dto);
  }

  public setChatUserTypingState(dto: SetUserTypingStateRequestDto) {
    return this.chatHubService.invoke<ApiResult>('chat.setTypingState', dto);
  }

  public getChatById(id: string): Chat | undefined {
    return this._chats.find(x => x.id == id);
  }

  public getUserChatByUserId(userId: string): UserChat | undefined {
    return this._chats.find(x => x instanceof UserChat && x.member.id === userId) as UserChat | undefined;
  }

  public setActiveChat(chat: Chat | undefined): boolean {
    const currentActiveChat = this._activeChat$.value;

    if (chat) {
      if (currentActiveChat?.id === chat.id)
        return false;

      this._activeChatChanged.next();
      this._activeChatChanged.complete();

      this._activeChatChanged = new ReplaySubject<void>(1);

      if (currentActiveChat) {
        this.clearSelectedMessages();
      }

      this._activeChat$.next(chat);
      this._activeChatMessages$.next([...chat.messages]);

      chat.messageNew$.pipe(takeUntil(this._activeChatChanged)).subscribe(x => {
        const messages = chat.messages;

        this._activeChatMessages$.next([...messages]);
      });

      chat.messageEdited$.pipe(takeUntil(this._activeChatChanged)).subscribe(x => {
        const messages = chat.messages;

        this._activeChatMessages$.next([...messages]);
      });

      chat.messageDeleted$.pipe(takeUntil(this._activeChatChanged)).subscribe(message => {
        const messages = chat.messages;

        this.removeMessageFromSelected(message);

        this._activeChatMessages$.next([...messages]);
      });
    } else {
      if (!currentActiveChat)
        return false;

      this._activeChatChanged.next();
      this._activeChatChanged.complete();

      this._activeChatChanged = new ReplaySubject<void>(1);

      this.clearSelectedMessages();

      this._activeChat$.next(undefined);
      this._activeChatMessages$.next([]);
    }

    return true;
  }

  public loadMoreMessages(direction: 'older' | 'newer' = 'older'): Observable<ChatMessage[]> | false {
    const chat = this._activeChat$.value!;
    const messages = this._activeChatMessages$.value;

    let lastMessage: ChatMessage | undefined = direction == 'older' ? messages[0] : messages[messages.length - 1];

    if (!lastMessage)
      return false;

    if (direction === 'newer' && chat.latestMessages === chat.messages)
      return false;

    return chat.loadMessages({
      limit: 20,
      offsetId: lastMessage.id,
      offset: direction === 'older' ? -20 : 1,
    }, 'current', this).pipe(
      tap(res => {
        this._activeChatMessages$.next([...chat.messages]);
      })
    )
  }

  public jumpToMessage(messageId: string | 'latest' | Date, position: 'start' | 'center' | 'end', highlight: boolean): Observable<{ message: ChatMessage, }> {
    const chat = this._activeChat$.value!;

    return chat.loadMessageAdvanced(messageId,20, this)
      .pipe(
        catchError((err, caught) => {
          return EMPTY;
        }),
        takeWhile(() => this._activeChat$.value === chat),
        tap(({ message }) => {
          const messages = chat.messages;

          this._activeChatMessages$.next([...messages]);

          this._jumpToMessage$.next({ messageId: message.id, position: position, highlight: highlight, });
        }),
      );
  }

  public addMessageToSelected(message: ChatMessage) {
    const selectedMessages = this._selectedMessages$.value;
    const selectedMessagesSize = selectedMessages.size;

    if (selectedMessagesSize >= 100) {
      return;
    }

    selectedMessages.add(message);

    if (selectedMessages.size > selectedMessagesSize) {
      this._selectedMessages$.next(new Set(selectedMessages));
    }
  }

  public removeMessageFromSelected(message: ChatMessage) {
    const selectedMessages = this._selectedMessages$.value;

    if (selectedMessages.delete(message)) {
      this._selectedMessages$.next(new Set(selectedMessages));
    }
  }

  public clearSelectedMessages() {
    const selectedMessages = this._selectedMessages$.value;

    if (selectedMessages.size === 0)
      return;

    this._selectedMessages$.next(new Set());
  }

  private chatMemberProfileModalRef?: ModalRef;

  public setActiveChatMemberProfile(member: UserProfile | undefined) {
    if (member) {
      if (this._activeChatMemberProfile$.value) {
        this.setActiveChatMemberProfile(undefined);
      }

      this._activeChatMemberProfile$.next(member);5

      const ref = this.modalService.open(ChatMemberProfileModalComponent, {
        showHeader: false,
        dismissableMask: true,
      });

      (<any><unknown>ref)['id'] = 'chatMemberProfile';

      ref.onClose.subscribe(value => {
        this._activeChatMemberProfile$.next(undefined);
      });

      this.chatMemberProfileModalRef = ref;
    } else {
      if (this.chatMemberProfileModalRef) {
        this.chatMemberProfileModalRef.close();

        this._activeChatMemberProfile$.next(undefined);
      }
    }
  }

  private _orderChats() {
    this._chats = this._chats.sort((chat1, chat2) => {
      return chat2.sortDate.getTime() - chat1.sortDate.getTime();
    });

    this._chats$.next(this._chats);
  }

  private _addChat(chat: Chat) {
    this._chats = [chat, ...this._chats];

    this._orderChats();
  }

  private _removeChat(chat: Chat, destroy: boolean = true) {
    this._chats = this._chats.filter(chat => chat.id !== chat.id);

    this._orderChats();

    if (destroy) {
      chat.destroy();
    }

    if (this._activeChat$.value?.id === chat.id) {
      this.setActiveChat(undefined);
    }
  }
}
