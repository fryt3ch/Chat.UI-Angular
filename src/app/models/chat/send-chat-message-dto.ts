import {ChatMessageDto} from "./chat-message-dto";

export interface SendChatMessageDto {
  chatId: string;

  messageDto: ChatMessageDto;
}

export interface SendChatMessageRequestDto {
  content: string;
}
