import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {ChatService} from "../../../services/chat/chat.service";
import {Observable, tap} from "rxjs";
import {ChatMessage} from "../../../models/chat/chat-message";

@Component({
  selector: 'app-chat-message-list',
  templateUrl: './chat-message-list.component.html',
  styleUrls: ['./chat-message-list.component.scss']
})
export class ChatMessageListComponent implements
    OnInit,
    AfterViewInit,
    AfterViewChecked,
    OnDestroy {

  @Input() direction: 'bottomToTop' | 'topToBottom' = 'bottomToTop';

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef<HTMLElement>;

  private prevScrollTop: number | undefined;
  private isLatestMessageInList: boolean = true;
  private isUserScrolled: boolean | undefined;
  private olderMessagesLoaded: boolean | undefined;
  private isNewMessageSentByUser: boolean | undefined;
  private hasNewMessages: boolean | undefined;
  private unreadMessageCount: number = 0;
  private highlightedMessageId: string | undefined;
  private containerHeight: number | undefined;

  protected messages$!: Observable<ChatMessage[]>;

  constructor(private chatService: ChatService, private ngZone: NgZone) {

  }

  ngOnInit(): void {
    this.messages$ = this.chatService.activeChatMessages$
        .pipe(
            tap(messages => {
              if (messages.length === 0) {
                // reset scroll state

                return;
              }
            }),
        );
  }

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      this.scrollContainer.nativeElement.addEventListener('scroll', (event) => {
        this.scrolled(event);
      });
    });
  }

  ngAfterViewChecked(): void {
    if (this.highlightedMessageId) {
      // Turn off programatic scroll adjustments while jump to message is in progress
      this.hasNewMessages = false;
      this.olderMessagesLoaded = false;
    }

    if (this.direction == "topToBottom") {
      if (this.hasNewMessages && (this.isNewMessageSentByUser || !this.isUserScrolled)) {
        if (this.isLatestMessageInList) {
          this.scrollToTop();
        } else {
          this.jumpToLatestMessage();
        }

        this.hasNewMessages = false;
        this.containerHeight = this.scrollContainer.nativeElement.scrollHeight;
      }
    } else {
      if (this.hasNewMessages) {
        if (!this.isUserScrolled || this.isNewMessageSentByUser) {
          if (this.isLatestMessageInList) {
            this.scrollToTop();
          } else {
            this.jumpToLatestMessage();
          }
        }

        this.hasNewMessages = false;
        this.containerHeight = this.scrollContainer.nativeElement.scrollHeight;
      } else if (this.olderMessagesLoaded) {
        this.preserveScrollbarPosition();
        this.containerHeight = this.scrollContainer.nativeElement.scrollHeight;
        this.olderMessagesLoaded = false;
      } else if (this.getScrollPosition() !== 'bottom' &&
          !this.isUserScrolled &&
          !this.highlightedMessageId) {
        this.isLatestMessageInList
            ? this.scrollToBottom()
            : this.jumpToLatestMessage();
        this.containerHeight = this.scrollContainer.nativeElement.scrollHeight;
      }
    }
  }

  ngOnDestroy(): void {
  }

  private scrolled(event: Event) {
    if (this.scrollContainer.nativeElement.scrollHeight === this.scrollContainer.nativeElement.clientHeight)
      return;

    const scrollPosition = this.getScrollPosition();

    const isUserScrolled = (this.direction === 'bottomToTop' ? scrollPosition !== 'bottom' : scrollPosition !== 'top') || !this.isLatestMessageInList;

    if (this.isUserScrolled !== isUserScrolled) {
      this.ngZone.run(() => {
        this.isUserScrolled = isUserScrolled;

        if (!this.isUserScrolled) {
          this.unreadMessageCount = 0;
        }
      });
    }

    console.log(scrollPosition);

    if (this.shouldLoadMoreMessages(scrollPosition)) {
      this.ngZone.run(() => {
        this.containerHeight = this.scrollContainer.nativeElement.scrollHeight;

        let direction: 'newer' | 'older';

        if (this.direction === 'topToBottom') {
          direction = scrollPosition === 'top' ? 'newer' : 'older';
        } else {
          direction = scrollPosition === 'top' ? 'older' : 'newer';
        }

        // load messages

        console.log('load', direction);
      });
    }

    this.prevScrollTop = this.scrollContainer.nativeElement.scrollTop;
  }

  scrollToBottom(): void {
    this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;

    this.forceRepaint();
  }

  private forceRepaint() {
    // Solves the issue of empty screen on Safari when scrolling
    this.scrollContainer.nativeElement.style.display = 'none';
    this.scrollContainer.nativeElement.offsetHeight; // no need to store this anywhere, the reference is enough
    this.scrollContainer.nativeElement.style.display = '';
  }

  scrollToTop() {
    this.scrollContainer.nativeElement.scrollTop = 0;
  }

  private getScrollPosition(): 'top' | 'middle' | 'bottom' {
    const scrollTop = this.scrollContainer.nativeElement.scrollTop;

    const parentMessageHeight = 0;

    if (Math.floor(scrollTop) <= parentMessageHeight && (this.prevScrollTop === undefined || this.prevScrollTop > parentMessageHeight)) {
      return 'top';
    } else if (Math.ceil(scrollTop) + this.scrollContainer.nativeElement.clientHeight >= this.scrollContainer.nativeElement.scrollHeight) {
      return 'bottom';
    }

    return 'middle';
  }

  private shouldLoadMoreMessages(scrollPosition: 'top' | 'middle' | 'bottom') {
    return scrollPosition !== 'middle' && !this.highlightedMessageId;
  }

  private jumpToLatestMessage() {

  }

  private preserveScrollbarPosition() {
    this.scrollContainer.nativeElement.scrollTop =
        (this.prevScrollTop || 0) +
        (this.scrollContainer.nativeElement.scrollHeight - this.containerHeight!);
  }
}
