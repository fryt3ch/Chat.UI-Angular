import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import {ChatMessage} from "../../../models/chat/chat-message";
import {ChatService} from "../../../services/chat/chat.service";
import {MenuItem} from "primeng/api";
import {first, Subject, takeUntil} from "rxjs";
import {ChatMessageType} from "../../../models/common/chat-message-type.enum";

@Component({
  selector: 'app-chat-message',
  templateUrl: './chat-message.component.html',
  styleUrls: ['./chat-message.component.scss']
})
export class ChatMessageComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true, }) public message!: ChatMessage;
  @Input() public isSelectionModeOn: boolean = false;
  @Input() public isHighlighted: boolean = false;
  @Input() public hasTail: boolean = false;
  @Input() public isFirstInGroup: boolean = false;
  @Input() public isLastInGroup: boolean = false;

  @Output() onSelect = new EventEmitter<{ message: ChatMessage, }>();
  @Output() onUnselect = new EventEmitter<{ message: ChatMessage, }>();
  @Output() onDelete = new EventEmitter<{ message: ChatMessage, }>();
  @Output() onCopy = new EventEmitter<{ message: ChatMessage, }>();
  @Output() onCopySelectedText = new EventEmitter<{ message: ChatMessage, }>();
  @Output() onEdit = new EventEmitter<{ message: ChatMessage, }>();
  @Output() onReply = new EventEmitter<{ message: ChatMessage, }>();
  @Output() onForward = new EventEmitter<{ message: ChatMessage, }>();
  @Output() onPin = new EventEmitter<{ message: ChatMessage, }>();
  @Output() onUnpin = new EventEmitter<{ message: ChatMessage, }>();
  @Output() onCancelSelection = new EventEmitter<void>();
  @Output() onDeleteSelected = new EventEmitter<void>();
  @Output() onForwardSelected = new EventEmitter<void>();

  protected isSelected: boolean = false;

  private readonly _destroy$ = new Subject<void>();

  constructor(private elementRef: ElementRef, private chatService: ChatService) {

  }

  ngOnInit() {
    this.chatService.selectedMessages$
      .pipe(takeUntil(this._destroy$))
      .subscribe(messages => {
        this.isSelected = messages.has(this.message);
      });

    if (this.message.messageType === ChatMessageType.quoted) {
      if (this.message.sourceMessage) {
        this.message.sourceMessage.userProfile$
          .pipe(takeUntil(this._destroy$))
          .subscribe(value => {
            if (value) {
              if (!this.message.isSenderMe) {
                setTimeout(() => {
                  const quotedElement = this.elementRef.nativeElement.getElementsByClassName('quoted')[0];

                  if (quotedElement) {
                    quotedElement.style.setProperty('--peer-color-rgb', `var(--peer-${value.color}-color-rgb)`);
                  }
                }, 0);
              }
            }
          });
      }
    } else if (this.message.messageType === ChatMessageType.forwarded) {
      if (this.message.sourceUserProfile$) {
        this.message.sourceUserProfile$
          .pipe(
            takeUntil(this._destroy$),
          )
          .subscribe(value => {
            if (value) {
              if (!this.message.isSenderMe) {
                setTimeout(() => {
                  const forwardedElement = this.elementRef.nativeElement.getElementsByClassName('forwarded')[0];

                  if (forwardedElement) {
                    forwardedElement.style.setProperty('--peer-color-rgb', `var(--peer-${value.color}-color-rgb)`);
                  }
                }, 0);
              }
            }
          });
      }
    }
  }

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();

    const contextMenuElement = this.chatService.contextMenuElement.el.nativeElement;

    if (contextMenuElement.getAttribute('data-type') === 'chat-message' && contextMenuElement.getAttribute('data-message-id') === this.message.id) {
      this.chatService.contextMenuElement.hide();
    }
  }

  protected onMessageContextMenu(mouseEvent: MouseEvent, isBubble: boolean) {
    const contextMenu = this.chatService.contextMenuElement;

    this.bubbleMenuItems.forEach(x => x.visible = false);

    if (!this.isSelectionModeOn) {
      if (isBubble) {
        if (this.message.canBeDeleted)
          this.setBubbleMenuItemVisibility('delete', true);

        if (this.message.canBeEdited)
          this.setBubbleMenuItemVisibility('edit', true);

        if (this.message.isPinned)
          this.setBubbleMenuItemVisibility('unpin', true);
        else
          this.setBubbleMenuItemVisibility('pin', true);

        this.setBubbleMenuItemVisibility('select', true);

        this.setBubbleMenuItemVisibility('forward', true);
        this.setBubbleMenuItemVisibility('reply', true);
      } else {
        this.setBubbleMenuItemVisibility('select', true);
      }
    } else {
      if (!this.isSelected) {
        this.setBubbleMenuItemVisibility('select', true);
      } else {
        if (isBubble) {
          if (this.isSelected)
            this.setBubbleMenuItemVisibility('unselect', true);
        }

        this.setBubbleMenuItemVisibility('deleteSelected', true);
        this.setBubbleMenuItemVisibility('forwardSelected', true);
        this.setBubbleMenuItemVisibility('cancelSelection', true);
      }
    }

    contextMenu.model = this.bubbleMenuItems;

    const contextMenuElement = contextMenu.el.nativeElement;

    contextMenu.show(mouseEvent);

    contextMenuElement.setAttribute('data-type', 'chat-message');
    contextMenuElement.setAttribute('data-message-id', this.message.id);

    contextMenu.onHide.pipe(first()).subscribe(() => {
      contextMenuElement.removeAttribute('data-type');
      contextMenuElement.removeAttribute('data-message-id');
    });
  }

  protected onMessageClick(event: MouseEvent, isBubble: boolean) {
    if (this.isSelectionModeOn) {
      if (this.isSelected) {
        this.onUnselect.emit({ message: this.message, });
      } else {
        this.onSelect.emit({ message: this.message, });
      }
    }
  }

  protected onQuotedClick(event: MouseEvent) {
    if (this.message.sourceMessage) {
      this.chatService.jumpToMessage(this.message.sourceMessage.id, 'center', true)
        .subscribe();
    }
  }

  protected onForwardedNameClick(event: MouseEvent) {
    if (this.message.sourceUserProfile$) {
      this.message.sourceUserProfile$
        .pipe(first())
        .subscribe(value => {
          if (value) {
            this.chatService.setActiveChatMemberProfile(value);
          }
        });
    }
  }

  protected setBubbleMenuItemVisibility(id: string, state: boolean) {
    const item = this.bubbleMenuItems.find(x => x.id === id);

    if (item)
      item.visible = state;
  }

  protected bubbleMenuItems: MenuItem[] = [
    {
      id: 'reply',
      label: 'Reply',
      icon: 'pi pi-fw pi-reply',
      iconStyle: { 'transform': 'scaleX(-1.0)', },

      command: () => {
        this.onReply.emit({ message: this.message, });
      }
    },
    {
      id: 'edit',
      label: 'Edit',
      icon: 'pi pi-fw pi-pencil',

      command: () => {
        this.onEdit.emit({ message: this.message, });
      }
    },
    {
      id: 'pin',
      label: 'Pin',
      icon: 'pi pi-fw pi-bookmark',

      command: () => {
        this.onPin.emit({ message: this.message, });
      }
    },
    {
      id: 'unpin',
      label: 'Unpin',
      icon: 'pi pi-fw pi-bookmark',

      command: () => {
        this.onUnpin.emit({ message: this.message, });
      }
    },
    {
      id: 'copy',
      label: 'Copy',
      icon: 'pi pi-fw pi-copy',

      command: () => {
        this.onCopy.emit({ message: this.message, });
      }
    },
    {
      id: 'copySelectedText',
      label: 'Copy selected text',
      icon: 'pi pi-fw pi-copy',

      command: () => {
        this.onCopySelectedText.emit({ message: this.message, });
      }
    },
    {
      id: 'forward',
      label: 'Forward',
      icon: 'pi pi-fw pi-reply',

      command: () => {
        this.onForward.emit({ message: this.message, });
      }
    },
    {
      id: 'forwardSelected',
      label: 'Forward Selected',
      icon: 'pi pi-fw pi-reply',

      command: () => {
        this.onForwardSelected.emit();
      }
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-fw pi-trash',

      command: () => {
        this.onDelete.emit({ message: this.message, });
      }
    },
    {
      id: 'deleteSelected',
      label: 'Delete Selected',
      icon: 'pi pi-fw pi-trash',

      command: () => {
        this.onDeleteSelected.emit();
      }
    },
    {
      id: 'select',
      label: 'Select',
      icon: 'pi pi-fw pi-check',

      command: () => {
        this.onSelect.emit({ message: this.message, });
      }
    },
    {
      id: 'unselect',
      label: 'Unselect',
      icon: 'pi pi-fw pi-times',

      command: () => {
        this.onUnselect.emit({ message: this.message, });
      }
    },
    {
      id: 'cancelSelection',
      label: 'Cancel Selection',
      icon: 'pi pi-fw pi-times',

      command: () => {
        this.onCancelSelection.emit();
      }
    },
  ];
  protected readonly ChatMessageType = ChatMessageType;

  ngOnChanges(changes: SimpleChanges) {

  }
}
