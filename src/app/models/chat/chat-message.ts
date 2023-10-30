import {ChatMessageDto} from "./chat-message-dto";
import {Chat} from "./chat";
import {ChatService} from "../../services/chat/chat.service";
import {take} from "rxjs";

export class ChatMessage {
  id: string;

  userId: string;
  isViewed: boolean;
  content: string;
  sentAt: Date;

  chat: Chat;

  isSenderMe: boolean = false;

  constructor(id: string, userId: string, isViewed: boolean, content: string, sentAt: Date, chat: Chat) {
    this.id = id;
    this.userId = userId;
    this.isViewed = isViewed;
    this.content = content;
    this.sentAt = sentAt;

    this.chat = chat;
  }

  static fromDto(dto: ChatMessageDto, chat: Chat, chatService: ChatService): ChatMessage {
    var message = new ChatMessage(dto.id, dto.userId, false, dto.content, dto.sentAt, chat);

    chatService.userProfileService.userProfile$.pipe(take(1)).subscribe(next => {
      message.isSenderMe = next.id == message.userId;
    });

    return message;
  }
}
