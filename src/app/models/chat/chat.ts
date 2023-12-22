import {ChatMessage} from "./chat-message";
import {
  BehaviorSubject, catchError,
  EMPTY,
  filter,
  lastValueFrom,
  map,
  Observable,
  of, ReplaySubject,
  share,
  switchMap, takeUntil,
  tap,
  throwError
} from "rxjs";
import {UserProfile} from "../user-profile/user-profile";
import {ChatService} from "../../services/chat/chat.service";
import {UserProfileColor} from "../common/user-profile-color.enum";
import {ChatUserTypingState} from "./chat-user-typing-state.enum";
import {ApiResult} from "../common/api-result";
import {GetChatMessagesRequestDto} from "./get-chat-messages-dto";
import {ChatDtoBase, UserChatDto} from "./chat-dto";

export enum ChatType {
  User = 0,
}

export type MessageSetType = 'latest' | 'current' | 'new';

export interface MessageSet {
  isCurrent: boolean;
  isLatest: boolean;

  messages: ChatMessage[];
}

export abstract class Chat {
  id: string;

  private _messageSets: MessageSet[];

  lastMessageInputValue?: string;

  chatType: ChatType;
  createdAt: Date;

  pinnedMessages: ChatMessage[];

  public get messages(): ChatMessage[] {
    return this._messageSets.find(x => x.isCurrent)?.messages || [];
  };

  public get latestMessages(): ChatMessage[] {
    return this._messageSets.find(x => x.isLatest)?.messages || [];
  };

  protected readonly _members$: BehaviorSubject<UserProfile[]> = new BehaviorSubject<UserProfile[]>([]);

  public readonly messagesToEdit$ = new BehaviorSubject<{ chat: Chat, messages: ChatMessage[], editType: 'reply' | 'forward' | 'edit', } | undefined>(undefined);

  private readonly _latestMessage$: BehaviorSubject<ChatMessage | undefined> = new BehaviorSubject<ChatMessage | undefined>(undefined);
  private readonly _unreadMessagesAmount$: BehaviorSubject<number>;
  private readonly _lastReadMessageSentAt$: BehaviorSubject<Date>;
  private readonly _membersTyping$ = new BehaviorSubject<{ member: UserProfile, typingState: ChatUserTypingState, }[]>([]);

  abstract get displayName(): string;
  abstract get avatarPhotoUrl$(): Observable<string> | undefined;
  abstract get isOnline(): boolean | undefined;
  abstract get color(): UserProfileColor;

  public get members() { return this._members$.value; };

  public readonly messageNew$!: Observable<ChatMessage>;
  public readonly messageDeleted$!: Observable<ChatMessage>;
  public readonly messageEdited$!: Observable<ChatMessage>;
  public readonly latestMessage$: Observable<ChatMessage | undefined> = this._latestMessage$.asObservable();
  public readonly unreadMessagesAmount$: Observable<number>;
  public readonly lastReadMessageSentAt$: Observable<Date>;
  public readonly memberTypingState$!: Observable<{ member: UserProfile, typingState: ChatUserTypingState, }>;
  public readonly membersTyping$: Observable<{ member: UserProfile, typingState: ChatUserTypingState, }[]> = this._membersTyping$.asObservable();

  public readonly chatRead$: Observable<{ lastReadMessageSentAt: Date, unreadMessagesAmount: number, }>;

  public lastScrolledMessageDate: Date;

  private readonly _isLoadingMessages$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public readonly isLoadingMessages$: Observable<boolean> = this._isLoadingMessages$.asObservable();

  private _destroy$ = new ReplaySubject<void>(1);

  public get sortDate(): Date {
    const latestMessage = this._latestMessage$.value;

    if (latestMessage) {
      return latestMessage.sentAt;
    } else {
      return this.createdAt;
    }
  };

  protected constructor(
    id: string,
    chatType: ChatType,
    lastReadMessageSentAt: Date,
    createdAt: Date,
    unreadMessagesAmount: number,
    chatService: ChatService
  ) {
    this.chatType = chatType;
    this.id = id;

    this.createdAt = createdAt;

    this._lastReadMessageSentAt$ = new BehaviorSubject<Date>(lastReadMessageSentAt);
    this._unreadMessagesAmount$ = new BehaviorSubject<number>(unreadMessagesAmount);

    this.unreadMessagesAmount$ = this._unreadMessagesAmount$.asObservable();
    this.lastReadMessageSentAt$ = this._lastReadMessageSentAt$.asObservable();

    this.lastScrolledMessageDate = this._getLastScrolledMessageDateLocal() ?? lastReadMessageSentAt;

    this._messageSets = [{ messages: [], isLatest: true, isCurrent: true, }];

    this.pinnedMessages = [];

    this.messageNew$ = chatService.messageNew$
      .pipe(
        filter(x => x.chat.id === this.id),
        map(x => x.message),
        share(),
      );

    this.messageEdited$ = chatService.messageEdited$
      .pipe(
        filter(x => x.chat.id === this.id),
        map(x => x.message),
        share(),
      );

    this.messageDeleted$ = chatService.messageDeleted$
      .pipe(
        filter(x => x.chat.id === this.id),
        map(x => x.message),
        share(),
      );

    this.memberTypingState$ = chatService.memberTypingState$
      .pipe(
        filter(x => x.chat.id === this.id),
        map(x => ({ member: x.member, typingState: x.typingState, })),
        share(),
      );

    this.chatRead$ = chatService.chatRead$
      .pipe(
        filter(x => {
          if (x.chatId !== this.id)
            return false;

          if (x.lastReadMessageSentAt < this._lastReadMessageSentAt$.value || x.unreadMessagesAmount >= this._unreadMessagesAmount$.value)
            return false;

          return true;
        }),
        map(x => ({ lastReadMessageSentAt: x.lastReadMessageSentAt, unreadMessagesAmount: x.unreadMessagesAmount, })),
        share(),
      );

    this.chatRead$.pipe(takeUntil(this._destroy$)).subscribe(value => {
      this._lastReadMessageSentAt$.next(value.lastReadMessageSentAt);
      this._unreadMessagesAmount$.next(value.unreadMessagesAmount);
    });

    this.messageNew$.pipe(takeUntil(this._destroy$)).subscribe(message => {
      if (message.isSenderMe) {
        this._lastReadMessageSentAt$.next(message.sentAt);
        this._unreadMessagesAmount$.next(0);
      } else {
        this._unreadMessagesAmount$.next(this._unreadMessagesAmount$.value + 1);
      }
    });

    this.messageDeleted$.pipe(takeUntil(this._destroy$)).subscribe(message => {
      if (this.canMessageBeRead(message)) {
        const newUnreadMessagesAmount = this._unreadMessagesAmount$.value - 1;

        if (newUnreadMessagesAmount >= 0)
          this._unreadMessagesAmount$.next(newUnreadMessagesAmount);
      }
    });

    chatService.messageDeleted$.pipe(takeUntil(this._destroy$)).subscribe(message => {
      const messagesToEdit = this.messagesToEdit$.value;

      if (messagesToEdit) {
        if (messagesToEdit.messages.find(x => x.id === message.message.id)) {
          this.messagesToEdit$.next(undefined);
        }
      }
    });

    this.memberTypingState$.pipe(takeUntil(this._destroy$)).subscribe(value => {
      const members = this._membersTyping$.value;

      if (value.typingState === ChatUserTypingState.None) {
        const newMembers = members.filter(x => x.member.id !== value.member.id);

        if (newMembers.length < members.length) {
          this._membersTyping$.next(newMembers);
        }
      } else {
        let memberInfo = members.find(x => x.member.id === value.member.id);

        if (memberInfo) {
          memberInfo.typingState = value.typingState;
        } else {
          memberInfo = { ...value, };

          members.push(memberInfo);
        }

        this._membersTyping$.next([...members]);
      }
    });
  }

  public destroy() {
    this._destroy$.next();
    this._destroy$.complete();
  }

  static fromDto(dto: ChatDtoBase, chatService: ChatService): Chat {
    let chat: Chat;

    if (dto.chatType == ChatType.User) {
      const aDto = <UserChatDto>dto;

      const userProfile = UserProfile.fromDto(aDto.userProfile, chatService.userProfileService);

      chatService.userProfileService.update(userProfile.id, userProfile);

      chat = new UserChat(
        dto.id,
        new Date(dto.lastReadMessageSentAt),
        new Date(dto.createdAt),
        dto.unreadMessagesAmount,
        userProfile,
        chatService
      );
    } else {
      throw { message: `This chat type is not supported!` };
    }

    if (dto.lastMessage) {
      const lastMessage = ChatMessage.fromDto(dto.lastMessage, chatService);

      chat.addMessageSorted(lastMessage, true, true, 'current');

      chat._latestMessage$.next(lastMessage);
    }

    return chat;
  }

  addPinnedMessage(message: ChatMessage) {
    this._addToMessageList(this.pinnedMessages, message, false, true, (x) => x.pinnedAt!);
  }

  removePinnedMessage(messageId: string) {
    const { result, removed, } = this._removeMessageFromList(this.pinnedMessages, messageId);

    if (removed) {
      this.pinnedMessages = result;
    }

    return removed;
  }

  findMessage(messageId: string): { message: ChatMessage, messageSetIdx: number, messageIdx: number, } | undefined {
    return this._findMessage(message => message.id === messageId);
  }

  private _findMessage(searchFunc: (message: ChatMessage) => boolean): { message: ChatMessage, messageSetIdx: number, messageIdx: number, } | undefined {
    let messageIdx = -1;

    const messageSetIdx = this._messageSets.findIndex(set => (messageIdx = set.messages.findIndex(searchFunc)) >= 0);

    if (messageSetIdx < 0 || messageIdx < 0)
      return undefined;

    return { message: this._messageSets[messageSetIdx].messages[messageIdx], messageIdx: messageIdx, messageSetIdx: messageSetIdx, };
  }

  private _findClosestMessageToDate(date: Date): { message: ChatMessage, messageSetIdx: number, messageIdx: number, } | undefined {
    let closestMessageIdx = -1;
    let closestMessageSetIdx = -1;

    let closestMessageDateDiff = 0;

    this._messageSets.forEach((messageSet, messageSetIdx) => {
      messageSet.messages.forEach((message, messageIdx) => {
        const closestMessage: ChatMessage | undefined = this._messageSets[closestMessageSetIdx]?.messages[closestMessageIdx];

        const dateDiff = Math.abs(message.sentAt.getTime() - date.getTime());

        if (closestMessage) {
          if (dateDiff <  closestMessageDateDiff) {
            closestMessageIdx = messageIdx;
            closestMessageSetIdx = messageSetIdx;

            closestMessageDateDiff = dateDiff;
          } else {
            return;
          }
        } else {
          closestMessageIdx = messageIdx;
          closestMessageSetIdx = messageSetIdx;

          closestMessageDateDiff = dateDiff;
        }
      });
    });

    if (closestMessageSetIdx < 0 || closestMessageIdx < 0)
      return undefined;

    return { message: this._messageSets[closestMessageSetIdx].messages[closestMessageIdx], messageIdx: closestMessageIdx, messageSetIdx: closestMessageSetIdx, };
  }

  public static findClosestMessageInList(date: Date, messages: ChatMessage[]): ChatMessage {
    date = new Date(date);
    const sortedMessages = messages.sort((a, b) => {
      return Math.abs(date.getTime() - a.sentAt.getTime()) - Math.abs(date.getTime() - b.sentAt.getTime());
    });

    return sortedMessages[0];
  }

  addMessagesSorted(messages: ChatMessage[], timestampChanged: boolean = false, addIfDoesNotExist: boolean = true, messageSetToAddToIfDoesNotExist: MessageSetType = 'current') {
    const { targetMessageSetIdx, messagesToAdd, } = this._findTargetMessageSet(messages, addIfDoesNotExist, messageSetToAddToIfDoesNotExist);

    if (targetMessageSetIdx >= 0) {
      const messageSet = this._messageSets[targetMessageSetIdx];

      messagesToAdd.forEach(message => {
        messageSet.messages = this._addToMessageList(messageSet.messages, message, timestampChanged, addIfDoesNotExist);

        const latestMessage = this._latestMessage$.value;

        if (latestMessage) {
          if (message.sentAt > latestMessage.sentAt || message.id === latestMessage.id)
            this._latestMessage$.next(message);
        } else {
          this._latestMessage$.next(message);
        }

        const relatedMessage = this._findMessage(x => x.sourceMessage?.id === message.id);

        if (relatedMessage) {
          relatedMessage.message.sourceMessage = message;
        }
      });
    } else {
      messagesToAdd.forEach(message => {
        const relatedMessage = this._findMessage(x => x.sourceMessage?.id === message.id);

        if (relatedMessage) {
          relatedMessage.message.sourceMessage = message;
        }
      });
    }

    return { messageSet: this._messageSets[targetMessageSetIdx] };
  }

  addMessageSorted(message: ChatMessage, timestampChanged: boolean = false, addIfDoesNotExist: boolean = true, messageSetToAddToIfDoesNotExist: MessageSetType = 'current') {
    return this.addMessagesSorted([message], timestampChanged, addIfDoesNotExist, messageSetToAddToIfDoesNotExist);
  }

  private _addToMessageList(
    messageList: ChatMessage[],
    message: ChatMessage,
    timestampChanged: boolean = false,
    addIfDoesNotExist: boolean = true,
    getSortDateFn: (a: ChatMessage) => Date = (a) => a.sentAt
  )
  {
    const addMessageToList = addIfDoesNotExist || timestampChanged;

    if (timestampChanged) {
      messageList = messageList.filter(x => x.id !== message.id);
    }

    const messageListLength = messageList.length;

    if (messageListLength === 0) {
      if (addMessageToList)
        return [...messageList, message];

      return [...messageList];
    }

    const messageIsNewest = getSortDateFn(messageList[messageListLength - 1]) < getSortDateFn(message);

    if (messageIsNewest) {
      if (addMessageToList)
        return [...messageList, message];

      return [...messageList];
    }

    let left = 0;
    let middle = 0;
    let right = messageListLength - 1;

    while (left <= right) {
      middle = Math.floor((right + left) / 2);

      if (getSortDateFn(messageList[middle]) <= getSortDateFn(message))
        left = middle + 1;
      else
        right = middle - 1;
    }

    if (!timestampChanged) {
      if (messageList[left] && message.id === messageList[left].id) {
        messageList[left] = message;

        return [...messageList];
      }

      if (messageList[left - 1] && message.id === messageList[left - 1].id) {
        messageList[left - 1] = message;

        return [...messageList];
      }
    }

    if (addMessageToList) {
      messageList.splice(left, 0, message);
    }

    return [...messageList];
  }

  removeMessage(messageId: string, messageSetIdx?: number): { message: ChatMessage, messageIdx: number, messageSetIdx: number,  } | false {
    let isRemoved = false;

    const message = this.findMessage(messageId);

    const relatedMessage = this._findMessage(x => x.sourceMessage?.id === messageId);

    if (relatedMessage) {
      relatedMessage.message.sourceMessage = undefined;
    }

    if (message) {
      if (!messageSetIdx)
        messageSetIdx = message.messageSetIdx;

      const { removed: isRemoved, result } = this._removeMessageFromList(this._messageSets[messageSetIdx].messages, messageId);

      if (isRemoved) {
        this._messageSets[messageSetIdx].messages = result;

        if (this._latestMessage$.value?.id === message.message.id) {
          const latestMessages = this.latestMessages;

          if (latestMessages) {
            this._latestMessage$.next(latestMessages[latestMessages.length - 1]);
          } else {
            this._latestMessage$.next(undefined);
          }
        }

        return { message: message.message, messageSetIdx: messageSetIdx, messageIdx: message.messageIdx, }
      }
    }

    return isRemoved;
  }

  private _removeMessageFromList(messageList: ChatMessage[], messageId: string) {
    const result = messageList.filter(x => x.id !== messageId);

    return { removed: result.length < messageList.length, result, };
  }

  private _findTargetMessageSet(newMessages: ChatMessage[], addIfDoesNotExist: boolean = true, messageSetToAddToIfDoesNotExist: MessageSetType = 'current') {
    let messagesToAdd: ChatMessage[] = newMessages;
    let targetMessageSetIdx!: number;

    if (addIfDoesNotExist) {
      const overlappingMessageSetIdxes = this._messageSets
        .map((_, idx) => idx)
        .filter(idx => this.areMessageSetsOverlap(this._messageSets[idx].messages, newMessages));

      switch (messageSetToAddToIfDoesNotExist) {
        case "new":
          if (overlappingMessageSetIdxes.length > 0) {
            targetMessageSetIdx = overlappingMessageSetIdxes[0];
          } else {
            this._messageSets.push({ messages: [], isCurrent: false, isLatest: false, });

            targetMessageSetIdx = this._messageSets.length - 1;
          }
          break;

        case "current":
          targetMessageSetIdx = this._messageSets.findIndex(x => x.isCurrent);
          break;

        case "latest":
          targetMessageSetIdx = this._messageSets.findIndex(x => x.isLatest);
          break;

        default:
          targetMessageSetIdx = -1;
          break;
      }

      const mergeTargetMessageSetIdx: number | undefined = overlappingMessageSetIdxes.splice(0, 1)[0];
      const mergeSourceMessageSetIdxes = [...overlappingMessageSetIdxes];

      if (mergeTargetMessageSetIdx !== undefined && mergeTargetMessageSetIdx !== targetMessageSetIdx) {
        mergeSourceMessageSetIdxes.push(targetMessageSetIdx);
      }

      if (mergeSourceMessageSetIdxes.length > 0) {
        const target = this._messageSets[mergeTargetMessageSetIdx];
        const sources = this._messageSets.filter((_, idx) => mergeSourceMessageSetIdxes.indexOf(idx) >= 0);

        sources.forEach(x => {
          target.isLatest = target.isLatest || x.isLatest;
          target.isCurrent = target.isCurrent || x.isCurrent;

          messagesToAdd = [...messagesToAdd, ...x.messages];
        });

        sources.forEach(x => {
          this._messageSets.splice(this._messageSets.indexOf(x), 1);
        });

        const overlappingMessageSetIdx = this._messageSets.findIndex(x => this.areMessageSetsOverlap(x.messages, newMessages));

        targetMessageSetIdx = overlappingMessageSetIdx;
      }
    } else {
      targetMessageSetIdx = this.findMessage(newMessages[0].id)?.messageSetIdx ?? -1;
    }

    return { targetMessageSetIdx, messagesToAdd, };
  }

  private areMessageSetsOverlap(messages1: ChatMessage[], messages2: ChatMessage[]) {
    return messages1.some(m1 => messages2.find(m2 => m1.id === m2.id));
  }

  private switchToMessageSet(idx: number) {
    const currentMessagesSet = this._messageSets.find(x => x.isCurrent);

    if (!currentMessagesSet)
      return;

    currentMessagesSet.isCurrent = false;
    this._messageSets[idx].isCurrent = true;
  }

  public loadMessages(dto: GetChatMessagesRequestDto, messageSetToAddToIfDoesNotExist: MessageSetType = 'current', chatService: ChatService) {
    this._isLoadingMessages$.next(true);

    dto = { chatId: this.id, ...dto, };

    return chatService.getChatMessages(dto)
      .pipe(
        map(value => value.messages.map(messageDto => ChatMessage.fromDto(messageDto, chatService))),
        tap(messages => {
          this._isLoadingMessages$.next(false);

          this.addMessagesSorted(messages, false, true,  messageSetToAddToIfDoesNotExist);
        }),
      );
  }

  public loadMessageAdvanced(messageId: string | 'latest' | Date, amountAround: number = 25, chatService: ChatService): Observable<{ message: ChatMessage, }> {
    let message;
    const latestMessage = this._latestMessage$.value;

    if (!latestMessage)
      return throwError(() => new Error('Latest message is undefined!'));

    if (messageId instanceof Date) {
      const messageTime = messageId.getTime();

      message = this._findMessage(message => message.sentAt.getTime() === messageTime);

      if (message) {
        messageId = message.message.id;
      }
    } else if (messageId === 'latest') {
      const messageSetIdx = this._messageSets.findIndex(set => set.isLatest);

      message = { message: latestMessage, messageSetIdx: messageSetIdx, messageIdx: this._messageSets[messageSetIdx].messages.findIndex(message => message.id === latestMessage.id), }
      messageId = message.message.id;
    } else {
      message = this.findMessage(messageId);
    }

    let getMessages$;

    if (message) {
      const messageSet = this._messageSets[message.messageSetIdx];
      const setLength = messageSet.messages.length;

      const messagesLeft = setLength - message.messageIdx - 1;
      const messagesRight = message.messageIdx;

      if (messagesLeft < amountAround || messagesRight < amountAround) {
        getMessages$ = this.loadMessages(messageId instanceof Date ? { offsetDate: messageId.toISOString(), limit: amountAround, offset: -amountAround / 2 } : { offsetId: messageId, limit: amountAround, offset: -amountAround / 2 }, 'new', chatService);
      } else {
        this.switchToMessageSet(message.messageSetIdx);

        return of({ message: message.message, });
      }
    } else {
      getMessages$ = this.loadMessages(messageId instanceof Date ? { offsetDate: messageId.toISOString(), limit: amountAround, offset: -amountAround / 2 } : { offsetId: messageId, limit: amountAround, offset: -amountAround / 2 }, 'new', chatService);
    }

    return getMessages$
      .pipe(
        map(value => {
          if (messageId instanceof Date) {
            message = this._findClosestMessageToDate(messageId);
          } else {
            message = this.findMessage(messageId);
          }

          if (message) {
            this.switchToMessageSet(message.messageSetIdx);

            return { message: message.message, };
          } else {
            throw new Error('Message not found after load!');
          }
        }),
      );
  }

  public addMember(member: UserProfile) {
    this._members$.next([...this._members$.value, member]);
  }

  public canMessageBeRead(message: ChatMessage) {
    if (message.isSenderMe || message.sentAt <= this._lastReadMessageSentAt$.value)
      return false;

    return true;
  }

  public read(messageId: string, chatService: ChatService): false | Observable<ApiResult> {
    const message = this.findMessage(messageId);

    const lastReadMessageSentAt = this._lastReadMessageSentAt$.value;

    if (!message)
      return false;

    this.lastScrolledMessageDate = message.message.sentAt;
    this._setLastScrolledMessageDateLocal(this.lastScrolledMessageDate);

    if (!this.canMessageBeRead(message.message))
      return false;

    this._lastReadMessageSentAt$.next(message.message.sentAt);

    if (this._latestMessage$.value?.id === messageId) {
      this._unreadMessagesAmount$.next(0);
    } else {
      const messages = this._messageSets[message.messageSetIdx];

      let unreadMessagesAmount = this._unreadMessagesAmount$.value;

      for (let i = message.messageIdx; i >= 0; i--) {
        const x = messages.messages[i];

        if (unreadMessagesAmount <= 0 || x.sentAt <= lastReadMessageSentAt)
          break;

        unreadMessagesAmount--;
      }

      if (this._unreadMessagesAmount$.value > unreadMessagesAmount) {
        this._unreadMessagesAmount$.next(unreadMessagesAmount);
      }
    }

    chatService.readChat({ chatId: this.id, lastReadMessageSentAt: message.message.sentAt.toISOString(), lastReadMessageId: '' })
      .pipe(
        catchError((err, caught) => {
          console.log(err);

          return EMPTY;
        })
      )
      .subscribe(x => console.log(x));

    return false;
  }

  public clear() {
    this._messageSets = [{ messages: [], isLatest: true, isCurrent: true, }];

    if (this._latestMessage$.value) {
      this._latestMessage$.next(undefined);
    }

    if (this._unreadMessagesAmount$.value) {
      this._unreadMessagesAmount$.next(0);
    }
  }

  private _getLastScrolledMessageDateLocal(): Date | undefined {
    const item = localStorage.getItem(`chat-${this.id}-lastScrolledMessageDate`);

    if (item) {
      return new Date(parseInt(item));
    }

    return undefined;
  }

  private _setLastScrolledMessageDateLocal(date: Date) {
    localStorage.setItem(`chat-${this.id}-lastScrolledMessageDate`, date.getTime().toString());
  }
}

export class UserChat extends Chat {
  member: UserProfile;

  override get displayName(): string {
    return this.member.displayName;
  }

  override get avatarPhotoUrl$(): Observable<string> | undefined {
    return this.member.avatarPhotoUrl$;
  }

  override get isOnline(): boolean | undefined {
    return this.member.isOnline;
  }

  override get color(): UserProfileColor {
    return this.member.color;
  }

  constructor(
    id: string,
    lastReadMessageSentAt: Date,
    createdAt: Date,
    unreadMessagesAmount: number,
    member: UserProfile,
    chatService: ChatService
  ) {
    super(
      id,
      ChatType.User,
      lastReadMessageSentAt,
      createdAt,
      unreadMessagesAmount,
      chatService
    );

    this.member = member;

    this.addMember(member);
  }
}
