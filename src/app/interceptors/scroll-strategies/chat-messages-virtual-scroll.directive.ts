import {Directive, forwardRef, Input} from "@angular/core";
import {VIRTUAL_SCROLL_STRATEGY} from "@angular/cdk/scrolling";
import {ChatMessage} from "../../models/chat/chat-message";
import {ChatMessagesVirtualScrollStrategy} from "./chat-messages-virtual-scroll.strategy";

@Directive({
    selector: '[appChatMessagesVirtualScroll]',
    providers: [
        {
            provide: VIRTUAL_SCROLL_STRATEGY,
            /* We will use `useFactory` and `deps` approach for providing the instance  */
            useFactory: (d: ChatMessagesVirtualScrollDirective) => d._scrollStrategy,
            deps: [forwardRef(() => ChatMessagesVirtualScrollDirective)],
        },
    ],
})
export class ChatMessagesVirtualScrollDirective {
    /* Create an instance of the custom scroll strategy that we are going to provide  */
    _scrollStrategy = new ChatMessagesVirtualScrollStrategy();

    private _messages!: ChatMessage[];

    @Input({ required: true, })
    set messages(value: ChatMessage[]) {
        this._scrollStrategy.updateMessages(value);
        this._messages = value;
    }
}
