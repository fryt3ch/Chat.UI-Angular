export interface DeleteChatMessagesDto {
    chatId: string,
    messages: string[],
}

export interface DeleteChatMessagesRequestDto {
    chatId: string,
    messageIds: string[],
}
