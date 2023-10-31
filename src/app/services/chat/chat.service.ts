import {Injectable} from '@angular/core';
import * as signalR from "@microsoft/signalr";
import {HttpClient, HttpParams} from "@angular/common/http";
import {
  BehaviorSubject,
  catchError,
  distinctUntilChanged, EMPTY,
  from,
  map,
  Observable,
  shareReplay,
  Subject,
  tap
} from "rxjs";
import {ApiResultWithData} from "../../models/common/api-result";
import {Chat, UserChat} from "../../models/chat/chat";
import {GetChatMessagesRequestDto} from "../../models/chat/get-chat-messages-dto";
import {ChatMessageDto} from "../../models/chat/chat-message-dto";
import {ChatMessage} from "../../models/chat/chat-message";
import {UserProfileService} from "../user-profile/user-profile.service";
import {ChatUserTypingState} from "../../models/chat/chat-user-typing-state.enum";
import {SetUserTypingStateDto, SetUserTypingStateRequestDto} from "../../models/chat/set-user-typing-state-dto";
import {DeleteChatMessagesDto, DeleteChatMessagesRequestDto} from "../../models/chat/delete-chat-messages-dto";
import {SendChatMessageDto, SendChatMessageRequestDto} from "../../models/chat/send-chat-message-dto";
import {GetChatsPreviewsRequestDto} from "../../models/chat/get-chat-previews-dto";
import {ChatPreviewDto, UserChatPreviewDto} from "../../models/chat/chat-preview-dto";
import {EditChatMessageDto, EditChatMessageRequestDto} from "../../models/chat/edit-chat-message-dto";

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private connection: signalR.HubConnection;

  private readonly _chatsPreviewsLoaded$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private readonly _chats$: BehaviorSubject<Chat[]> = new BehaviorSubject<Chat[]>([]);

  private readonly _newMessage$: Subject<ChatMessage> = new Subject();
  private readonly _deletedMessage$: Subject<ChatMessage> = new Subject();
  private readonly _editedMessage$: Subject<ChatMessage> = new Subject();

  private readonly _activeChat$: BehaviorSubject<Chat | undefined> = new BehaviorSubject<Chat | undefined>(undefined);
  private readonly _activeChatMessages$: BehaviorSubject<ChatMessage[]> = new BehaviorSubject<ChatMessage[]>([]);

  public readonly selectedChatIsTyping$: BehaviorSubject<boolean> = <BehaviorSubject<boolean>>(new BehaviorSubject<boolean>(false)).pipe(
      distinctUntilChanged(),
  );

  public readonly chats$: Observable<Chat[]> = this._chats$.asObservable();
  public readonly newMessage$: Observable<ChatMessage> = this._newMessage$.asObservable();
  public readonly deletedMessage$: Observable<ChatMessage> = this._deletedMessage$.asObservable();
  public readonly activeChat$: Observable<Chat | undefined> = this._activeChat$.asObservable();
  public readonly activeChatMessages$: Observable<ChatMessage[]> = this._activeChatMessages$.asObservable();
  public readonly chatsPreviewsLoaded$: Observable<boolean> = this._chatsPreviewsLoaded$.asObservable();

  constructor(private httpClient: HttpClient, public userProfileService: UserProfileService) {
    this.connection = new signalR.HubConnectionBuilder()
      .configureLogging(signalR.LogLevel.Debug)
      .withUrl("/hubs/chat")
      .build();

    this.connection.on("SendMessage", (dto: SendChatMessageDto) => {
      const chat = this.getChatById(dto.chatId);

      if (!chat) {
        return;
      }

      const message = ChatMessage.fromDto(dto.messageDto, chat, this);

      chat.addMessages([message], false);

      this._newMessage$.next(message);
    });

    this.connection.on("EditMessage", (dto: EditChatMessageDto) => {
      const chat = this.getChatById(dto.chatId);

      if (!chat) {
        return;
      }

      const message = ChatMessage.fromDto(dto.messageDto, chat, this);

      const idx = chat.messages.findIndex(x => x.id == message.id);

      if (idx < 0)
        return;

      chat.messages[idx] = message;

      this._editedMessage$.next(message);
    });

    this.connection.on("DeleteMessages", (dto: DeleteChatMessagesDto) => {
      const chat = this.getChatById(dto.chatId);

      if (!chat) {
        return;
      }

      dto.messageIds.forEach(x => {
        const message = chat.getMessageById(x);

        if (message) {
          chat.removeMessageBy(message);

          this._deletedMessage$.next(message);
        }
      });
    });

    this.connection.on("SetUserTypingState", (dto: SetUserTypingStateDto) => {
      const chat = this.getChatById(dto.chatId);

      if (!chat) {
        return;
      }

      const member = chat.members.find(x => x.id == dto.userId);

      if (!member) {
        return;
      }

      if (dto.state == ChatUserTypingState.None) {
        member.chatTypingStateInfo$.next(undefined);
      }
      else {
        member.chatTypingStateInfo$.next({ chatId: chat.id, state: dto.state, });
      }
    });

    this.selectedChatIsTyping$.subscribe(x => {
      if (!this._activeChat$.value)
        return;

      const dto: SetUserTypingStateRequestDto = {
        state: x ? ChatUserTypingState.Typing : ChatUserTypingState.None,
      };

      //console.log(x);

      this.setChatUserTypingState(this._activeChat$.value.id, dto)
          .subscribe();
    })
  }

  public sendMessage(chatId: string, sendMessageDto: SendChatMessageRequestDto) {
    return this.httpClient.post(`/api/chat/${chatId}/message`, sendMessageDto, { withCredentials: true, },);
  }

  public editMessage(chatId: string, messageId: string, dto: EditChatMessageRequestDto) {
    return this.httpClient.patch(`/api/chat/${chatId}/message/${messageId}`, dto, { withCredentials: true, });
  }

  public deleteMessages(chatId: string, dto: DeleteChatMessagesRequestDto) {
    return this.httpClient.delete(`/api/chat/${chatId}/messages`, { withCredentials: true, params: new HttpParams({ fromObject: dto as any, }) });
  }

  public getChatMessages(chat: Chat, dto: GetChatMessagesRequestDto) {
    return this.httpClient.get<ApiResultWithData<ChatMessageDto[]>>(`/api/chat/${chat.id}/messages`, { withCredentials: true, params: new HttpParams({ fromObject: dto as any, }) })
      .pipe(
        map(value => value.data.map(x => ChatMessage.fromDto(x, chat, this))),
        tap(messages => {
          this._activeChatMessages$.next([...messages, ...this._activeChatMessages$.value])
        }),
      );
  }

  public getChatsPreviews(dto: GetChatsPreviewsRequestDto) {
    return this.httpClient.get<ApiResultWithData<ChatPreviewDto[]>>(`/api/chats/previews`, { withCredentials: true, params: new HttpParams({ fromObject: dto as any, }) },)
      .pipe(
        map(value => value.data)
      );
  }

  public setChatUserTypingState(chatId: string, dto: SetUserTypingStateRequestDto) {
    return this.httpClient.put(`/api/chat/${chatId}/user-typing-state`, dto, { withCredentials: true, });
  }

  public startConnection() {
    return from(this.connection.start())
        .pipe(
            tap(next => {
              console.log("SignalR connected!");

              let getChatPreviewsDto: GetChatsPreviewsRequestDto = {
                offset: 0,
                count: 0,
              }

              this.getChatsPreviews(getChatPreviewsDto).pipe(
                  tap(chatPreviews => {

                  })
              ).subscribe(next => {
                for (let x of next) {
                  let chat = Chat.fromChatPreviewDto(x, this);

                  if (chat instanceof UserChat) {
                    if (chat.member.userProfile.avatarPhotoId)
                      chat.member.userProfile.avatarPhotoUrl$ = this.userProfileService.getPhoto({ userId: chat.member.id, photoId: chat.member.userProfile.avatarPhotoId, })
                          .pipe(shareReplay(1));
                  }

                  this._chats$.next([...this._chats$.value, chat]);
                }

                setTimeout(() => {
                  this._chatsPreviewsLoaded$.next(true);
                }, 500);
              });
            }),
            catchError((err, next) => {
              console.error(err.toString());

              return EMPTY;
            })
        );
  }

  public stopConnection() {
    return from(this.connection.stop());
  }

  public getChatById(id: string) {
    return this._chats$.value.find(x => x.id == id);
  }

  public setActiveChat(chat: Chat) {
    if (this._activeChat$.value == chat)
      return;

    this._activeChat$.next(chat);

    this._activeChatMessages$.next([...chat.messages]);
  }
}
