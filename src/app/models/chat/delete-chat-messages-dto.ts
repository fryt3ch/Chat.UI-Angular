export interface DeleteChatMessagesDto {
    chatId: string,
    messageIds: string[],
}

export interface DeleteChatMessagesRequestDto {
    messageIds: string[],
}
