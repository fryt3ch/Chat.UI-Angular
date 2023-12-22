import { Injectable } from '@angular/core';
import * as signalR from "@microsoft/signalr";
import {catchError, EMPTY, from, mergeMap, Observable, ReplaySubject, Subject, tap, timer} from "rxjs";
import {HttpResponse} from "@angular/common/http";
import {ApiError, isApiResult} from "../../models/common/api-result";
import {TranslateService} from "@ngx-translate/core";
import {ToastrService} from "ngx-toastr";
import {SendChatMessageDto} from "../../models/chat/send-chat-message-dto";
import {EditChatMessageDto} from "../../models/chat/edit-chat-message-dto";
import {DeleteChatMessagesDto} from "../../models/chat/delete-chat-messages-dto";
import {ChatNewDto} from "../../models/chat/chat-new-dto";
import {ChatClearedDto} from "../../models/chat/clear-chat-dto";
import {ChatDeletedDto} from "../../models/chat/delete-chat-dto";
import {ChatReadDto} from "../../models/chat/chat-read-dto";
import {SetUserTypingStateDto} from "../../models/chat/set-user-typing-state-dto";

@Injectable({
  providedIn: 'root'
})
export class ChatHubService {
  private _connection: signalR.HubConnection;

  private _connectionStatus$: ReplaySubject<'disconnected' | 'connecting' | 'connected'> = new ReplaySubject<"disconnected" | "connecting" | "connected">(1);

  public connectionStatus$ = this._connectionStatus$.asObservable();

  public messageNew$: Observable<SendChatMessageDto>;
  public messageEdited$: Observable<EditChatMessageDto>;
  public messagesDeleted$: Observable<DeleteChatMessagesDto>;

  public chatNew$: Observable<ChatNewDto>;
  public chatCleared$: Observable<ChatClearedDto>;
  public chatDeleted$: Observable<ChatDeletedDto>;
  public chatRead$: Observable<ChatReadDto>;
  public chatTypingState$: Observable<SetUserTypingStateDto>;

  constructor(
    private translateService: TranslateService,
    private toastrService: ToastrService,
  ) {
    this._connection = new signalR.HubConnectionBuilder()
      .configureLogging(signalR.LogLevel.Debug)
      .withUrl("/hubs/chat")
      .build();

    this._connection.onclose((error?) => {
      this._connectionStatus$.next('disconnected');
    });

    this.messageNew$ = this.on<SendChatMessageDto>("message.new");
    this.messageEdited$ = this.on<EditChatMessageDto>("message.edited");
    this.messagesDeleted$ = this.on<DeleteChatMessagesDto>("messages.deleted");

    this.chatNew$ = this.on<ChatNewDto>("chat.new");
    this.chatCleared$ = this.on<ChatClearedDto>("chat.cleared");
    this.chatDeleted$ = this.on<ChatDeletedDto>("chat.deleted");
    this.chatRead$ = this.on<ChatReadDto>("chat.read");
    this.chatTypingState$ = this.on<SetUserTypingStateDto>("chat.typingState");
  }

  public startConnection() {
    if (this._connection.state !== 'Disconnected') {
      return;
    }

    this._connectionStatus$.next('connecting');

    timer(1_000)
      .pipe(

      )
      .subscribe(() => {
        this._connection.start()
          .then(() => {
            this._connectionStatus$.next('connected');
          })
          .catch((error) => {
            this._connectionStatus$.next('disconnected');
          });
      });
  }

  public stopConnection() {
    return this._connection.stop();
  }

  private on<T>(methodName: string): Observable<T> {
    const subject = new Subject<T>();

    this._connection.on(methodName, data => {
      return subject.next(data);
    });

    return subject.asObservable();
  }

  invoke<T>(methodName: string, ...data: any): Observable<T> {
    return from(this._connection.invoke<T>(methodName, ...data))
      .pipe(
        tap(result => {
          if (!isApiResult(result) || result.succeeded)
            return;

          throw new ApiError(result);
        }),
        catchError(error => {
          if (error instanceof ApiError) {
            const innerError = error.apiResult.error;

            if (innerError) {
              this.translateService.get(`apiErrors.${innerError.message}`)
                .subscribe(x => {
                  this.toastrService.error(x, `${innerError.code}`);
                });
            }
          }

          throw error;
        }),
      );
  }
}
