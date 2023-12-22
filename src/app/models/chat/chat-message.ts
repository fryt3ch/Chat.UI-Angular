import {ChatMessageDto} from "./chat-message-dto";
import {Chat} from "./chat";
import {ChatService} from "../../services/chat/chat.service";
import {Observable, shareReplay} from "rxjs";
import {UserProfile} from "../user-profile/user-profile";
import {ChatMessageType} from "../common/chat-message-type.enum";

export class ChatMessage {
  id: string;

  messageType: ChatMessageType;

  userId: string;
  isViewed: boolean;
  content: string;
  sentAt: Date;

  receivedAt: Date | undefined;
  readAt: Date | undefined;

  sourceMessage: ChatMessage | undefined;

  pinnedAt: Date | undefined;
  pinnedBy: string | undefined;

  sourceUserId: string | undefined;

  isSenderMe: boolean = false;

  userProfile$: Observable<UserProfile | undefined>;
  sourceUserProfile$: Observable<UserProfile | undefined> | undefined;

  public get canBeDeleted(): boolean {
    return this.isSenderMe;
  };

  public get canBeEdited(): boolean {
    return this.isSenderMe && this.messageType !== ChatMessageType.forwarded;
  };

  public get canBeForwarded(): boolean {
    return true;
  };

  public get isPinned(): boolean {
    return !!this.pinnedBy;
  }

  constructor(
    id: string,
    messageType: ChatMessageType,
    userId: string,
    isViewed: boolean,
    content: string,
    sentAt: Date,
    receivedAt: Date | undefined,
    readAt: Date | undefined,
    sourceMessage: ChatMessage | undefined,
    sourceUserId: string | undefined,
    pinnedAt: Date | undefined,
    pinnedBy: string | undefined,
    chatService: ChatService
  ) {
    this.id = id;
    this.messageType = messageType;
    this.userId = userId;
    this.isViewed = isViewed;
    this.content = content;
    this.sentAt = sentAt;

    this.receivedAt = receivedAt;
    this.readAt = readAt;

    this.sourceMessage = sourceMessage;
    this.sourceUserId = sourceUserId;

    this.pinnedAt = pinnedAt;
    this.pinnedBy = pinnedBy;

    console.log(chatService.userProfileService.userProfile);

    if (this.userId === chatService.userProfileService.userProfile!.id) {
      this.isSenderMe = true;
    }

    this.userProfile$ = chatService.userProfileService.find(this.userId)
      .pipe(
        shareReplay(1),
      );

    if (this.sourceUserId) {
      this.sourceUserProfile$ = chatService.userProfileService.find(this.sourceUserId)
        .pipe(
          shareReplay(1),
        );
    }
  }

  static fromDto(dto: ChatMessageDto, chatService: ChatService): ChatMessage {
    const message = new ChatMessage(
      dto.id,
      dto.messageType,
      dto.userId,
      false,
      dto.content,
      new Date(dto.sentAt),
      dto.receivedAt ? new Date(dto.receivedAt) : undefined,
      dto.readAt ? new Date(dto.readAt) : undefined,
      dto.sourceMessageDto ? ChatMessage.fromDto(dto.sourceMessageDto, chatService) : undefined,
      dto.sourceUserId,
      dto.pinnedAt ? new Date(dto.pinnedAt) : undefined,
      dto.pinnedBy,
      chatService
    );

    return message;
  }
}
