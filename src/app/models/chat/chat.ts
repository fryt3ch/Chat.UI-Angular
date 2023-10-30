import {ChatMessage} from "./chat-message";
import {ChatPreviewDto, UserChatPreviewDto} from "./chat-preview-dto";
import {ChatMember, UserChatMember} from "./chat-member";
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {UserProfile} from "../user-profile/user-profile";
import {ChatService} from "../../services/chat/chat.service";
import {UserProfileColor} from "../common/user-profile-color.enum";

export enum ChatType {
  User = 0,
}

export abstract class Chat {
  id: string;

  get lastMessage(): ChatMessage | undefined {
    return this.messages.length == 0 ? undefined : this.messages[this.messages.length - 1]
  };

  notViewedMessagesCount: number;

  lastMessageInputValue?: string;
  lastMessageIdx: number;

  chatType: ChatType;

  private _messages$: BehaviorSubject<ChatMessage[]>;

  public get messages(): ChatMessage[] { return this._messages$.value; };

  protected readonly _members$: BehaviorSubject<ChatMember[]> = new BehaviorSubject<ChatMember[]>([]);

  public readonly messageToEdit$: BehaviorSubject<ChatMessage | undefined> = new BehaviorSubject<ChatMessage | undefined>(undefined);
  public readonly messageToReply$: BehaviorSubject<ChatMessage | undefined> = new BehaviorSubject<ChatMessage | undefined>(undefined);

  abstract get displayName(): string;
  abstract get avatarPhotoUrl$(): Observable<string> | undefined;
  abstract get isOnline(): boolean | undefined;
  abstract get color(): UserProfileColor;

  public get members() { return this._members$.value; };

  protected constructor(chatType: ChatType, id: string, messages: ChatMessage[]) {
    this.chatType = chatType;
    this.id = id;

    this.notViewedMessagesCount = 0;
    this.lastMessageIdx = -1;

    this._messages$ = new BehaviorSubject<ChatMessage[]>(messages);
  }

  static fromChatPreviewDto(dto: ChatPreviewDto, chatService: ChatService): Chat {
    let chat: Chat;

    if (dto.chatType == ChatType.User) {
      const aDto = <UserChatPreviewDto>dto;

      chat = new UserChat(dto.id, [], new UserChatMember(UserProfile.fromDto(aDto.userProfileDto)));
    } else {
      throw { message: `This chat type is not supported!` };
    }

    if (dto.lastMessagePreview) {
      const message = ChatMessage.fromDto(dto.lastMessagePreview, chat, chatService);

      chat.addMessages([message], true);
    }

    return chat;
  }

  getMessageById(id: string) : ChatMessage | undefined {
    return this.messages.find(x => x.id == id);
  }

  addMessages(messages: ChatMessage[], previous: boolean) {
    const newMessages = previous ? [...messages, ...this.messages] : [...this.messages, ...messages];

    this._messages$.next(newMessages);
  }

  removeMessageBy(message: ChatMessage) {
    const messages = this.messages.filter(x => x != message);

    if (this.messages.length == messages.length)
      return;

    this._messages$.next(messages);

    if (this.messageToEdit$.value?.id == message.id)
      this.messageToEdit$.next(undefined);
  }
}

export class UserChat extends Chat {
  member: UserChatMember;

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

  constructor(id: string, messages: ChatMessage[], member: UserChatMember) {
    super(ChatType.User, id, messages);

    this.member = member;

    this._members$.next([...this._members$.value, member]);
  }
}
