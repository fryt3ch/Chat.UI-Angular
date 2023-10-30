export interface ChatMessageDto {
  id: string,
  userId: string,
  content: string,
  sentAt: Date,
  receivedAt?: Date,
  watched?: Date,
}
