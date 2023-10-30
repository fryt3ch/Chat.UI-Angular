import {ChatMessageDto} from "./chat-message-dto";
import {ChatType} from "./chat";
import {UserProfileDto} from "../user-profile/user-profile-dto";

export interface ChatPreviewDto {
  id: string,
  chatType: ChatType;

  lastMessagePreview: ChatMessageDto,
}

export interface UserChatPreviewDto extends ChatPreviewDto {
  userProfileDto: UserProfileDto;
}
