import {ChatType} from "./chat";

export interface CreateChatRequestDto {
  chatType: ChatType,
  memberIds: string[],
}

export interface CreateChatDto {
  chatId: string,
  wasCreated: boolean,
}
