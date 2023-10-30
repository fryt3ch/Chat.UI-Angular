import {ChatMessageDto} from "./chat-message-dto";

export interface EditChatMessageDto {
    chatId: string;

    messageDto: ChatMessageDto;
}

export interface EditChatMessageRequestDto {
    content: string;
}
