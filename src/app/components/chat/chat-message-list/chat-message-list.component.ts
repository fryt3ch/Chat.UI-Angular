import {
  AfterViewChecked,
  AfterViewInit, ChangeDetectionStrategy,
  Component, DestroyRef,
  ElementRef, EventEmitter,
  Input,
  NgZone, OnChanges,
  OnDestroy,
  OnInit, Output, SimpleChanges,
  ViewChild
} from '@angular/core';
import {ChatService} from "../../../services/chat/chat.service";
import {
  BehaviorSubject, concatMap, debounceTime,
  delay,
  filter,
  first, fromEvent, last, map, merge, mergeMap,
  Observable,
  of, ReplaySubject, scan, share, shareReplay, skip,
  skipUntil,
  Subject,
  switchMap, take,
  takeUntil,
  tap, timer
} from "rxjs";
import {ChatMessage} from "../../../models/chat/chat-message";
import {UserProfileService} from "../../../services/user-profile/user-profile.service";
import {Chat} from "../../../models/chat/chat";
import {ContextMenu} from "primeng/contextmenu";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-chat-message-list',
  templateUrl: './chat-message-list.component.html',
  styleUrls: ['./chat-message-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ChatMessageListComponent implements
    OnInit,
    OnChanges,
    AfterViewInit,
    AfterViewChecked,
    OnDestroy {

  @ViewChild('scrollViewport') private scrollViewport!: ElementRef<HTMLElement>;
  @ViewChild('messageContextMenu') chatMessageContextMenu!: ContextMenu;

  @Input({ required: true, }) public chat!: Chat;
  @Input() public isSelectionModeOn: boolean = false;

  @Output() public onDeleteMessage = new EventEmitter<{ message: ChatMessage, }>();
  @Output() public onReplyMessage = new EventEmitter<{ message: ChatMessage, }>();
  @Output() public onEditMessage = new EventEmitter<{ message: ChatMessage, }>();
  @Output() public onCopyMessage = new EventEmitter<{ message: ChatMessage, }>();
  @Output() public onForwardMessage = new EventEmitter<{ message: ChatMessage, }>();
  @Output() public onCancelSelectionMessage = new EventEmitter<void>();
  @Output() public onDeleteSelectedMessage = new EventEmitter<void>();
  @Output() public onForwardSelectedMessage = new EventEmitter<void>();

  private prevScrollTop: number = 0;
  protected scrolledUp: boolean | undefined;
  protected unreadMessagesAmount: number = 0;
  protected highlightedMessageId$: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(undefined);
  private prevContainerHeight: number | undefined;

  private oldestMessage: ChatMessage | undefined;
  private latestMessage: ChatMessage | undefined;

  private isLatestMessageRendered: boolean = true;

  protected isLoadingMessages: boolean = false;
  protected isScrolling: boolean = false;

  protected groupedMessages$: Observable<{ date: Date, messageGroups: ChatMessage[][], }[]>;
  protected messages$: Observable<ChatMessage[]>;

  protected latestMessageIdInViewport: string | undefined;

  private _chatChanged$: ReplaySubject<void> = new ReplaySubject<void>(1);

  protected readonly _renderedMessages$: ReplaySubject<ChatMessage[]> = new ReplaySubject<ChatMessage[]>(1);

  protected readonly _messagesRenderCallback$: Subject<ChatMessage[]> = new Subject<ChatMessage[]>;

  protected stickyDateStuckCallback = new EventEmitter<{ date: Date, element: HTMLElement, isStuck: boolean, }>;

  protected trackMessageById(idx: number, value: any) {
    return value.id;
  }

  protected trackMessageGroupByIdx(idx: number, value: any) {
    return idx;
  }

  protected trackMessageDateGroupByTime(idx: number, value: any) {
    return value.date.getTime();
  }

  constructor(
    private chatService: ChatService,
    private userProfileService: UserProfileService,
    private ngZone: NgZone,
    private destroyRef: DestroyRef,
  ) {
    this.messages$ = this.chatService.activeChatMessages$;

    this.stickyDateStuckCallback.subscribe(data => {
      data.element.classList.toggle('is-stuck', data.isStuck);
    });

    this.groupedMessages$ = this.messages$
      .pipe(
        map(messages => {
          const dateGroups: { date: Date, messageGroups: ChatMessage[][] }[] = [];

          if (messages.length === 0)
            return dateGroups;

          function getDateNoHours(message: ChatMessage): number {
            return (new Date(message.sentAt.getTime())).setHours(0, 0, 0, 0);
          }

          let prevMessage = messages[0];

          let currentTime: number = getDateNoHours(prevMessage);
          let currentGroup: ChatMessage[] = [prevMessage];
          let currentGroups: ChatMessage[][] = [currentGroup];

          dateGroups.push({ date: new Date(currentTime), messageGroups: currentGroups, });

          if (messages.length === 1)
            return dateGroups;

          messages.slice(1).forEach((message, messageIdx) => {
            const dayTime = getDateNoHours(message);

            const isSameDayTime = currentTime === dayTime;

            if (isSameDayTime) {
              const newGroup = prevMessage.userId !== message.userId || (message.sentAt.getTime() - prevMessage.sentAt.getTime()) > 1000 * 60 * 10;

              if (newGroup) {
                currentGroup = [message];

                currentGroups.push(currentGroup);
              } else {
                currentGroup.push(message);
              }
            } else {
              currentTime = dayTime;
              currentGroup = [message];
              currentGroups = [currentGroup];

              dateGroups.push({ date: new Date(currentTime), messageGroups: currentGroups, });
            }

            prevMessage = message;
          });

          return dateGroups;
        }),
        shareReplay(1),
      );
  }

  ngOnInit(): void {
    merge(
      this._messagesRenderCallback$
        .pipe(
          filter(x => x.length > 0),
          map((value) => (state: ChatMessage[]) => [...(state).filter(x => !value.find(y => x.id === y.id)), ...value]),
        ),
      this.messages$.pipe(map((messages) => {
        return (state: ChatMessage[]) => state.filter(x => messages.find(y => y.id === x.id));
      }))
    )
      .pipe(
        scan((state: ChatMessage[], fn) => fn(state), []),
        mergeMap((x) => this.messages$.pipe(take(1), filter((value) => !value.some(y => !x.find(z => z.id === y.id))))),
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((messages) => {
        if (messages.length === 0) {
          this.resetScrollState();
        } else {
          const currentOldestMessage = messages[0];
          const currentLatestMessage = messages[messages.length - 1];

          if (!this.oldestMessage) {
            this.oldestMessage = currentOldestMessage;
          } else if (this.oldestMessage.sentAt > currentOldestMessage.sentAt || !messages.find(message => message.id === this.oldestMessage!.id)) {
            this.oldestMessage = currentOldestMessage;

            this.preserveScrollbarPosition();
          }

          this.isLatestMessageRendered = !this.latestMessage || currentLatestMessage.id === this.latestMessage.id;

          if (!this.isLatestMessageRendered) {
            this.scrolledUp = true;
          }

          this.readLatestMessageInViewport();
        }

        this._renderedMessages$.next(messages);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chat']) {
      const prevChat = changes['chat'].previousValue as (Chat | undefined);
      const actualChat = changes['chat'].currentValue as Chat;

      if (prevChat && prevChat.id === actualChat.id)
        return;

      this._chatChanged$.next();
      this._chatChanged$.complete();

      this._chatChanged$ = new ReplaySubject<void>(1);

      this.highlightedMessageId$.next(undefined);

      this.resetScrollState();

      this.chat.isLoadingMessages$
        .pipe(
          takeUntil(this._chatChanged$),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(isLoading => {
          this.isLoadingMessages = isLoading;
        });

      this.chat.latestMessage$
        .pipe(
          takeUntil(this._chatChanged$),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(message => {
          this.latestMessage = message;
      });

      this.chat.unreadMessagesAmount$
        .pipe(
          takeUntil(this._chatChanged$),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(amount => {
          this.unreadMessagesAmount = amount;
      });

      this.chat.messageNew$
        .pipe(
          switchMap(value =>
            this.getIsMessageRendered$(value.id).pipe(map(x => value))
          ),
          takeUntil(this._chatChanged$),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(message => {
          if (!this.scrolledUp) {
            this.scrollToBottom();
          }
        });

      this.chatService.jumpToMessage$
        .pipe(
          delay(50),
          switchMap(value =>
            this.getIsMessageRendered$(value.messageId).pipe(map(x => value))
          ),
          takeUntil(this._chatChanged$),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(value => {
          this.scrollMessageIntoView(value.messageId, value.position);

          if (value.highlight) {
            this.highlightMessage(value.messageId);
          }
        });

      const t = this.chat.lastScrolledMessageDate;

      this.chatService.jumpToMessage(t, 'end', false).subscribe(x => {

      });
    }
  }

  ngAfterViewInit() {
    this.groupedMessages$
      .subscribe(messages => {
        this.prevContainerHeight = this.scrollViewport.nativeElement.scrollHeight;
    });

    this.ngZone.runOutsideAngular(() => {
      this.scrollViewport.nativeElement.addEventListener('scroll', (event) => {
        this.scrolled(event);
      });

      fromEvent(this.scrollViewport.nativeElement, "scroll").pipe(
        tap(() => {
          if (this.isScrolling)
            return;

          this.ngZone.run(() => {
            this.isScrolling = true
          });
        }),
        debounceTime(1_500)
      ).subscribe(() => {
        this.ngZone.run(() => {
          this.isScrolling = false;
        });
      });
    });
  }

  ngAfterViewChecked(): void {

  }

  ngOnDestroy(): void {

  }

  private scrolled(event: Event) {
    if (this.scrollViewport.nativeElement.scrollHeight === this.scrollViewport.nativeElement.clientHeight)
      return;

    const scrollPosition = this.getScrollPosition();

    const scrolledUp = scrollPosition !== 'bottom' || !this.isLatestMessageRendered;

    if (this.scrolledUp !== scrolledUp) {
      this.ngZone.run(() => {
        this.scrolledUp = scrolledUp;
      });
    }

    this.readLatestMessageInViewport();

    if (this.shouldLoadMoreMessages(scrollPosition)) {
      this.ngZone.run(() => {
        let direction: 'newer' | 'older' = scrollPosition === 'top' ? 'older' : 'newer';

        const loadMoreMessages$ = this.chatService.loadMoreMessages(direction);

        if (loadMoreMessages$ === false) {

        } else {
         loadMoreMessages$.subscribe();
        }
      });
    }

    this.prevScrollTop = this.scrollViewport.nativeElement.scrollTop;
  }

  scrollToBottom(): void {
    this.scrollViewport.nativeElement.scroll({ top: this.scrollViewport.nativeElement.scrollHeight, behavior: 'instant', })

    this.forceRepaint();
  }

  private forceRepaint() {
    // Solves the issue of empty screen on Safari when scrolling
    this.scrollViewport.nativeElement.style.display = 'none';
    this.scrollViewport.nativeElement.offsetHeight; // no need to store this anywhere, the reference is enough
    this.scrollViewport.nativeElement.style.display = '';
  }

  scrollToTop() {
    this.scrollViewport.nativeElement.scroll({ top: 0, behavior: 'instant', })
  }

  resetScrollState() {
    this.scrolledUp = false;
    this.prevContainerHeight = undefined;
    this.oldestMessage = undefined;
    this.prevScrollTop = 0;
    this.isLatestMessageRendered = true;
  }

  private getScrollPosition(): 'top' | 'middle' | 'bottom' {
    const scrollTop = this.scrollViewport.nativeElement.scrollTop;

    if (Math.floor(scrollTop) <= 0 && (this.prevScrollTop === undefined || this.prevScrollTop > 0)) {
      return 'top';
    } else if (Math.ceil(scrollTop) + this.scrollViewport.nativeElement.clientHeight >= this.scrollViewport.nativeElement.scrollHeight) {
      return 'bottom';
    }

    return 'middle';
  }

  private shouldLoadMoreMessages(scrollPosition: 'top' | 'middle' | 'bottom') {
    return scrollPosition !== 'middle' && !this.isLoadingMessages;
  }

  protected jumpToLatestMessage() {
    this.chatService.jumpToMessage('latest', 'end', false)
      .subscribe();
  }

  private preserveScrollbarPosition() {
    if (this.prevContainerHeight === undefined)
      return;

    const containerHeight = this.scrollViewport.nativeElement.scrollHeight;

    const newScrollTop = this.prevScrollTop + (containerHeight - this.prevContainerHeight);

    //console.log(this.prevContainerHeight, containerHeight, this.prevScrollTop, newScrollTop);

    setTimeout(() => {
      this.scrollViewport.nativeElement.scrollTop = newScrollTop;
      this.prevScrollTop = newScrollTop;
    }, 0);
  }

  private getMessageElementById(messageId: string): HTMLElement | undefined {
    const element = document.querySelector(`[data-message-id="${messageId}"]`);

    if (element instanceof HTMLElement) {
      return element;
    }

    return undefined;
  }

  private getLatestMessageIdInViewport(): string | undefined {
    const elements = this.scrollViewport.nativeElement.querySelectorAll('[data-message-id]');
    const containerRect = this.scrollViewport.nativeElement.getBoundingClientRect();

    for (let i = elements.length - 1; i >= 0; i--) {
      const elementRect = elements[i].getBoundingClientRect();

      if ((elementRect.top + elementRect.height / 2) < containerRect.bottom) {
        return elements[i].getAttribute('data-message-id')!;
      }
    }

    return undefined;
  }

  private scrollMessageIntoView(messageId: string, position: 'start' | 'center' | 'end' = 'center') {
    const element = this.getMessageElementById(messageId);

    if (element) {
      //const behavior = Math.abs(this.scrollViewport.nativeElement.scrollTop - element.offsetTop) < 150 ? 'smooth' : 'instant';

      element.scrollIntoView({
        block: position,
        behavior: 'instant',
      });

      if (position === 'end' && this.latestMessage && this.latestMessage.id === messageId) {
        this.scrollToBottom();
      }
    }
  }

  private highlightMessage(messageId: string) {
    this.highlightedMessageId$.next(messageId);

    timer(2_500)
      .pipe(
        takeUntil(this.highlightedMessageId$.pipe(skip(1))),
        takeUntil(this._chatChanged$),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.highlightedMessageId$.next(undefined);
      });
  }

  protected onSelectMessage(event: { message: ChatMessage, }) {
      this.chatService.addMessageToSelected(event.message);
  }

  protected onUnselectMessage(event: { message: ChatMessage, }) {
    this.chatService.removeMessageFromSelected(event.message);
  }

  protected getJumpToLatestMessageBtnIcon() {
    if (this.isLoadingMessages) {
      return 'pi pi-spinner pi-spin'
    }

    return 'pi pi-chevron-down';
  }

  private getIsMessageRendered$(messageId: string) {
    return this._renderedMessages$
      .pipe(
        filter(messages => !!messages.find(x => x.id === messageId)),
        first(),
      )
  }

  protected getDateSeparatorDateFormat(date: Date): string {
    const currentDate = new Date();

    if (currentDate.getFullYear() !== date.getFullYear())
      return 'MMMM d, YYYY';

    return 'MMMM d';
  }

  protected readLatestMessageInViewport() {
    const latestMessageIdInViewport = this.getLatestMessageIdInViewport();

    if (latestMessageIdInViewport !== this.latestMessageIdInViewport) {
      this.latestMessageIdInViewport = latestMessageIdInViewport;

      if (latestMessageIdInViewport) {
        this.chat.read(latestMessageIdInViewport, this.chatService);
      }
    }
  }
}
