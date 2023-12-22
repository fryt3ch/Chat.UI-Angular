export interface ChatReadDto {
  chatId: string;
  lastReadMessageSentAt: string;
  unreadMessagesAmount: number;
}

export interface ChatReadRequestDto {
  chatId: string,
  lastReadMessageSentAt: string;
  lastReadMessageId: string;
}
