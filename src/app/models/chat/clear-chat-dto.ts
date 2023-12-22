export interface ClearChatRequestDto {
  chatId: string;
}

export interface ChatClearedDto {
  chatId: string;
  deletedMessagesAmount: number;
}
