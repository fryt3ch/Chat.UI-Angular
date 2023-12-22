import {ChatMessageDto} from "./chat-message-dto";
import {ChatType} from "./chat";
import {UserProfileDto} from "../user-profile/user-profile-dto";

export interface ChatDtoBase {
  id: string,
  chatType: ChatType,
  createdAt: Date,
  lastReadMessageSentAt: Date,
  unreadMessagesAmount: number,
  lastMessage?: ChatMessageDto,
}

export interface ChatDto extends ChatDtoBase {

}

export interface UserChatDto extends ChatDtoBase {
  userProfile: UserProfileDto;
}
