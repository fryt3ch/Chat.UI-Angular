import {ChatMessageDto} from "./chat-message-dto";

export interface SendChatMessageDto {
  messages: ChatMessageDto[];
}

export interface SendChatMessageRequestDto {
  chatId: string;

  content: string;
  quotedMessageId?: string | undefined;

  sourceChatId?: string | undefined;

  forwardedMessages?: string[] | undefined;
}
