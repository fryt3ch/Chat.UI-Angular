import {Component, DestroyRef, ElementRef, EventEmitter, NgZone, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ChatService} from "../../../services/chat/chat.service";
import {Chat, ChatType, UserChat} from "../../../models/chat/chat";
import {MenuItem} from "primeng/api";
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  filter,
  first,
  map,
  Observable,
  pairwise,
  ReplaySubject,
  share,
  shareReplay,
  startWith,
  Subject, take,
  takeUntil, takeWhile,
  tap
} from "rxjs";
import {DialogService, DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";
import {DatePickerModalComponent} from "../../date-picker-modal/date-picker-modal.component";
import {ChatMessage} from "../../../models/chat/chat-message";
import {getUserProfileColorProperties} from "../../../models/common/user-profile-color.enum";
import {GetChatMessagesRequestDto} from "../../../models/chat/get-chat-messages-dto";
import {UserProfile} from "../../../models/user-profile/user-profile";
import {ConfirmationModalComponent} from "../../confirmation-modal/confirmation-modal.component";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {ModalRef, ModalService} from "../../../services/modal.service";

@Component({
  selector: 'app-chat-preview-panel',
  templateUrl: './chat-preview-panel.component.html',
  styleUrls: ['./chat-preview-panel.component.scss']
})
export class ChatPreviewPanelComponent implements OnInit, OnDestroy {
  @ViewChild('chatsScrollViewport') chatsScrollViewport!: ElementRef<HTMLElement>;
  @ViewChild('searchInput') searchInput!: ElementRef;

  protected searchInputValue$: Subject<string> = new Subject<string>;

  protected searchInputValue: string = '';
  protected searchFilter$: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(undefined);

  private _datePickerModalRef: ModalRef | undefined;

  protected currentChatSearchIn: Chat | undefined;

  protected chats$: Observable<Chat[]>;
  protected chatsToDisplay$: Observable<Chat[]>;
  protected filteredChats$: Observable<Chat[]>;

  protected searchModeEnabled: boolean = false;
  protected chatsScrolledDown: boolean = false;

  protected foundUserProfiles$?: ReplaySubject<UserProfile[]>;
  protected foundUserProfiles: UserProfile[] = [];
  protected foundMessages$?: ReplaySubject<{ chat: Chat, message: ChatMessage, }[]>;
  protected foundMessages: { chat: Chat, message: ChatMessage, }[] = [];
  protected lastJumpedToMessageId?: string;

  protected activeChat: Chat | undefined;

  protected searchRequestChanged$?: ReplaySubject<void>;
  protected searchRequest$?: Observable<any>;

  private currentContextMenuChat?: Chat;

  constructor(
    protected chatService: ChatService,
    private destroyRef: DestroyRef,
    private modalService: ModalService,
    private ngZone: NgZone
  ) {
    this.chats$ = this.chatService.chats$;

    this.filteredChats$ = combineLatest([this.chats$, this.searchFilter$])
      .pipe(
        map(([chats, searchFilter]) => {
          if (!searchFilter)
            return chats;

          return chats
            .map(chat => {
              let filterIdx = -1;

              if (chat instanceof UserChat) {
                filterIdx = chat.member.username.toUpperCase().indexOf(searchFilter);
              }

              if (filterIdx < 0)
                filterIdx = chat.displayName.toUpperCase().indexOf(searchFilter);

              return { chat: chat, filterIdx: filterIdx, };
            })
            .filter(x => x.filterIdx >= 0)
            .sort((a, b) => a.filterIdx - b.filterIdx)
            .map(x => x.chat);
        }),
        shareReplay(1)
      );

    this.chatsToDisplay$ = this.chats$;

    this.chatService.activeChat$
      .subscribe(value => {
        this.activeChat = value;
      });
  }

  ngOnInit() {
    this.searchInputValue$
      .subscribe(value => {
        this.searchInputValue = value;
      });

    this.searchInputValue$
      .pipe(startWith(''))
      .pipe(
        map(value => ({ value: value, formatValue: value.trim().toUpperCase(), })),
        pairwise(), filter(([a, b]) => a.formatValue !== b.formatValue), map(([a, b]) => b),
        tap(value => {
          if (value.formatValue.length > 0) {
            if (this.currentChatSearchIn) {

            } else {
              if (!this.searchModeEnabled) {
                this.searchModeEnabled = true;
              }

              this.searchFilter$.next(value.formatValue);
              this.chatsToDisplay$ = this.filteredChats$;
            }
          } else {
            const currentChatSearchIn = this.currentChatSearchIn;
            this._resetSearch();

            if (currentChatSearchIn) {
              this.currentChatSearchIn = currentChatSearchIn;
              this.searchModeEnabled = true;
            }
          }
        }),
        filter(value => value.formatValue.length > 0),
        debounceTime(250),
        filter(value => this.searchModeEnabled && value.value === this.searchInputValue),
        map(value => value.formatValue),
      )
      .subscribe(value => {
        if (this.searchRequestChanged$) {
          this.searchRequestChanged$.next();
          this.searchRequestChanged$.complete();
        }

        this.searchRequestChanged$ = new ReplaySubject<void>(1);

        this.foundMessages$ = new ReplaySubject<{chat: Chat; message: ChatMessage}[]>(1);
        this.foundUserProfiles$ = new ReplaySubject<UserProfile[]>(1);

        let messagesSearch$ = this._getMessagesSearch$(value, true);

        messagesSearch$.subscribe();

        this.foundMessages$.pipe(takeUntil(this.searchRequestChanged$)).subscribe({
          next: (value) => {
            this.foundMessages = value;
          },
          complete: () => {
            this.foundMessages = [];
          },
        });

        if (this.currentChatSearchIn) {

        } else {
          let chatsSearch$ = this.chatService.userProfileService.search({ query: value, limit: 5, })
            .pipe(
              tap(value => {
                this.foundUserProfiles$!.next(value);
              })
            );

          chatsSearch$.subscribe();

          this.foundUserProfiles$.pipe(takeUntil(this.searchRequestChanged$)).subscribe({
            next: (value) => {
              this.foundUserProfiles = value;
            },
            complete: () => {
              this.foundUserProfiles = [];
            },
          });
        }
    });

    this.chatService.searchInChat$
      .pipe(

      )
      .subscribe(chat => {
        if (this.currentChatSearchIn) {
          if (this.currentChatSearchIn.id === chat.id)
            return;

        } else {

        }

        this._resetSearch();

        this.searchModeEnabled = true;
        this.currentChatSearchIn = chat;
        this.searchInput.nativeElement.focus();
      });
  }

  ngOnDestroy() {
    if (this._datePickerModalRef) {
      this._datePickerModalRef.close();
    }
  }

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      this.chatsScrollViewport.nativeElement.addEventListener('scroll', (event) => {
        this._chatsScrolled(event);
      });
    });
  }

  private _chatsScrolled(event: Event) {
    const clientHeight = this.chatsScrollViewport.nativeElement.clientHeight;
    const scrollHeight = this.chatsScrollViewport.nativeElement.scrollHeight;

    if (clientHeight === scrollHeight) {
      if (this.chatsScrolledDown) {
        this.ngZone.run(() => {
          this.chatsScrolledDown = false;
        });
      }
      return;
    }

    const scrollTop = this.chatsScrollViewport.nativeElement.scrollTop;

    this.ngZone.run(() => {
      if (scrollTop > 0) {
        this.chatsScrolledDown = true;
      } else {
        this.chatsScrolledDown = false;
      }
    });

    if (this.foundMessages.length > 0) {
      if (scrollTop + clientHeight === scrollHeight) {
        this._getMessagesSearch$(this.searchFilter$.value!, false)
          .subscribe(x => console.log('loaded more', x));
      }
    }
  }

  protected chatsViewportJumpToTop() {
    this.chatsScrollViewport.nativeElement.scrollTo({ top: 0, behavior: 'instant', })
  }

  private _resetSearch() {
    this.searchModeEnabled = false;
    this.currentChatSearchIn = undefined;
    this.lastJumpedToMessageId = undefined;

    this.searchInputValue$.next('');

    this.chatsToDisplay$ = this.chats$;

    if (this.searchRequestChanged$) {
      this.searchRequestChanged$.next();
      this.searchRequestChanged$.complete();

      this.searchRequestChanged$ = undefined;
    }

    this.foundMessages$ = undefined;
    this.foundUserProfiles$ = undefined;
    this.foundMessages = [];
    this.foundUserProfiles = [];
  }

  showDatePicker() {
    const datePicked = new EventEmitter<Date>();

    this._datePickerModalRef = this.modalService.open(DatePickerModalComponent, {
      showHeader: false,
      dismissableMask: true,

      data: {
        datePicked: datePicked,
      }
    });

    this._datePickerModalRef.onClose
      .subscribe(() => {
        this._datePickerModalRef = undefined;
      });

    datePicked.pipe(takeUntil(this._datePickerModalRef.onClose))
      .subscribe(value => {
        this._datePickerModalRef?.close();

        this.chatService.jumpToMessage(value, 'center', true).subscribe();
      });

/*    const dialogRef = this.dialogueService.dialogComponentRefMap.get(this.qrCodeModalDialogueRef)!;

    dialogRef.changeDetectorRef.detectChanges();

    const componentRef = dialogRef.instance.componentRef!;

    componentRef.setInput('qrData', `${'https://test-app.com'}/@${this.member.username}`);*/
  }

  removeCurrentChatSearchIn() {
    if (!this.currentChatSearchIn)
      return;

    this._resetSearch();
  }

  protected jumpToFoundMessage(chat: Chat, message: ChatMessage) {
    this.chatService.setActiveChat(chat);

    this.chatService.jumpToMessage(message.id, 'center', true)
      .subscribe();

    this.lastJumpedToMessageId = message.id;
  }

  protected selectFoundUserProfile(userProfile: UserProfile) {
    const existingChat = this.chatService.getUserChatByUserId(userProfile.id);

    if (existingChat) {
      this.setChatAsActive(existingChat);
    } else {
      const accept = new EventEmitter<void>();

      const ref = this.modalService.open(ConfirmationModalComponent, {
        dismissableMask: true,
        showHeader: false,

        data: {
          accept: accept,
        },
      });

      ref.setInput('text', "Are you sure you want to create a new conversation with this user?");

      accept.subscribe(() => {
        this.chatService.createChat({ chatType: ChatType.User, memberIds: [userProfile.id], })
          .pipe(

          )
          .subscribe(value => {
            const chat = this.chatService.getChatById(value.chatId);

            if (chat) {
              this.chatService.setActiveChat(chat);
            }
          });
      });
    }
  }

  protected setChatAsActive(chat: Chat) {
    this.chatService.setActiveChat(chat);
  }

  protected chatContextMenuClick(chat: Chat, event: MouseEvent) {
    this.currentContextMenuChat = chat;

    chat.unreadMessagesAmount$
      .pipe(
        take(1),
        takeWhile(x => this.currentContextMenuChat === chat),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(unreadMessagesAmount => {
        const contextMenuElement = this.chatService.contextMenuElement;

        contextMenuElement.model = this.menuItems;

        this.menuItems.forEach(x => x.visible = false);

        if (unreadMessagesAmount > 0) {
          this.menuItems.find(x => x.id === 'read')!.visible = true;
        }

        if (chat instanceof UserChat) {
          this.menuItems.find(x => x.id === 'viewProfile')!.visible = true;
          this.menuItems.find(x => x.id === 'clear')!.visible = true;
          this.menuItems.find(x => x.id === 'delete')!.visible = true;
        }

        contextMenuElement.show(event);
      });
  }

  protected menuItems: MenuItem[] = [
    {
      id: 'viewProfile',
      label: 'View profile',
      icon: 'pi pi-fw pi-user',

      command: (x) =>
      {
        const chat = this.currentContextMenuChat;

        if (chat instanceof UserChat)
        {
          this.chatService.setActiveChatMemberProfile(chat.member);
        }
      },
    },
    {
      id: 'read',
      label: 'Mark as read',
      icon: 'pi pi-fw pi-eye',
      command: () => {
        const chat = this.currentContextMenuChat;

        if (chat) {
          chat.latestMessage$.pipe(first())
            .subscribe(latestMessage => {
              if (latestMessage) {
                chat.read(latestMessage.id, this.chatService);
              }
            });
        }
      },
    },

    {
      id: 'clear',
      label: 'Clear',
      icon: 'pi pi-fw pi-trash',
      command: () => {
        const chat = this.currentContextMenuChat;

        if (chat) {
          this.chatService.clearChat({ chatId: chat.id, })
            .subscribe();
        }
      },
    },

    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-fw pi-trash',
      command: () => {
        const chat = this.currentContextMenuChat;

        if (chat) {
          const accept = new EventEmitter<void>();

          const ref = this.modalService.open(ConfirmationModalComponent, {
            dismissableMask: true,
            showHeader: false,

            data: {
              accept: accept,
            },
          });

          ref.setInput('text', "Are you sure you want to delete this chat? This action can't be undone!");

          accept.subscribe(() => {
            this.chatService.deleteChat({ chatId: chat.id, })
              .subscribe();
          });
        }
      },
    },
  ];

  protected readonly getUserProfileColorProperties = getUserProfileColorProperties;

  private _getMessagesSearch$(containsText: string, isInit: boolean) {
    let messagesSearchDto: GetChatMessagesRequestDto;

    let foundMessages = this.foundMessages;

    if (isInit) {
      messagesSearchDto = { containsText: containsText, limit: 15, offsetDate: (new Date()).toISOString(), offset: -15, };
    } else {
      messagesSearchDto = { containsText: containsText, limit: 15, offsetId: foundMessages[foundMessages.length - 1].message.id, offset: -15, };
    }

    if (this.currentChatSearchIn) {
      messagesSearchDto = { chatId: this.currentChatSearchIn.id, ...messagesSearchDto };
    }

    return this.chatService.getChatMessages(messagesSearchDto)
      .pipe(
        map(value => {
          return value.messages
            .map(messageDto => {
              return { chat: this.chatService.getChatById(messageDto.chatId)!, message: ChatMessage.fromDto(messageDto, this.chatService), };
            })
        }),
        tap(messages => {
          const prevLength = foundMessages.length;
          const filtered = foundMessages.filter(message => !messages.find(x => x.chat.id === message.chat.id && x.message.id === message.message.id));

          foundMessages = [...filtered, ...messages];

          if (prevLength > 0 && prevLength === foundMessages.length) {
            return;
          }

          foundMessages = [...foundMessages.sort((a, b) => b.message.sentAt.getTime() - a.message.sentAt.getTime())];


          this.foundMessages$!.next(foundMessages);
        }),
        share(),
        takeUntil(this.searchRequestChanged$!),
      );
  }
}
