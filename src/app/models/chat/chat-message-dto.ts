import {ChatMessageType} from "../common/chat-message-type.enum";

export interface ChatMessageDto {
  id: string;
  messageType: ChatMessageType;
  chatId: string;
  userId: string;
  content: string;
  sentAt: string;
  receivedAt: string | undefined;
  readAt: string | undefined;

  sourceMessageDto: ChatMessageDto | undefined;

  pinnedAt: string | undefined;
  pinnedBy: string | undefined;

  sourceUserId: string | undefined;
}
