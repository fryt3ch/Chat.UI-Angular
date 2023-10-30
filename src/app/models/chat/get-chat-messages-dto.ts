export interface GetChatMessagesRequestDto {
  offset: number,
  count: number,

  minDate?: Date,
  maxDate?: Date,
}
