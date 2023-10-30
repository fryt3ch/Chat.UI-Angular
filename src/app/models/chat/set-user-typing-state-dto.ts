import {ChatUserTypingState} from "./chat-user-typing-state.enum";

export interface SetUserTypingStateDto {
    chatId: string,
    userId: string,
    state: ChatUserTypingState,
}

export interface SetUserTypingStateRequestDto {
    state: ChatUserTypingState,
}
