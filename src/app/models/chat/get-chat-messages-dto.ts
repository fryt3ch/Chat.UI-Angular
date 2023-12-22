import {ChatMessageDto} from "./chat-message-dto";

export interface GetChatMessagesRequestDto {
  chatId?: string,

  limit: number,
  offsetId?: string,
  offsetDate?: string,
  offset?: number,

  containsText?: string,
}

export interface GetChatMessagesDto {
  messages: ChatMessageDto[],
}
