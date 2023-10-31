import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {ChatMessage} from "../../../models/chat/chat-message";
import {AuthService} from "../../../services/auth/auth.service";
import {ContextMenu} from "primeng/contextmenu";
import {ChatService} from "../../../services/chat/chat.service";
import {MenuItem, MenuItemCommandEvent} from "primeng/api";
import {ChatViewPanelComponent} from "../chat-view-panel/chat-view-panel.component";
import {Observable, Subject, takeUntil} from "rxjs";
import {DomHandler} from "primeng/dom";

@Component({
  selector: 'app-chat-message',
  templateUrl: './chat-message.component.html',
  styleUrls: ['./chat-message.component.scss']
})
export class ChatMessageComponent implements OnInit, OnDestroy {
  @Input({ required: true, }) public message!: ChatMessage;
  @Input({ required: false, }) public contextMenu: ContextMenu | undefined;
  @Input({ required: false, }) public messageSelected$!: Observable<ChatMessage>;
  @Input({ required: false, }) public messageUnselected$!: Observable<ChatMessage>;
  @Input({ required: false, }) public isSelectionModeOn!: boolean;

  @Output() onSelect = new EventEmitter<void>();
  @Output() onUnselect = new EventEmitter<void>();
  @Output() onDelete = new EventEmitter<void>();
  @Output() onCopy = new EventEmitter<void>();
  @Output() onContextMenu = new EventEmitter<{mouseEvent: MouseEvent, isBubble: boolean}>;

  protected isSelected: boolean = false;

  private readonly _destroy$ = new Subject<void>();

  constructor(private chatService: ChatService) {

  }

  ngOnInit() {
    return;

    this.messageSelected$.pipe(takeUntil(this._destroy$)).subscribe(x => {
      if (x != this.message)
        return;

      this.isSelected = true;

      console.log('Selected-True', this.message.id);
    });

    this.messageUnselected$.pipe(takeUntil(this._destroy$)).subscribe(x => {
      if (x != this.message)
        return;

      this.isSelected = false;

      console.log('Selected-False', this.message.id);
    });
  }

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
  }

  protected onMessageContextMenu(mouseEvent: MouseEvent, isBubble: boolean) {
    if (!this.contextMenu)
      return;

    this.contextMenu.model = this.bubbleMenuItems;

    if (isBubble) {
      if (this.isSelected) {
        this.bubbleMenuItems.forEach(x => x.visible = false);

        this.bubbleMenuItems.find(x => x.id == "unselect")!.visible = true;
      } else {
        this.bubbleMenuItems.forEach(x => x.visible = true);

        this.bubbleMenuItems.find(x => x.id == "unselect")!.visible = false;
      }

      if (this.message.isSenderMe) {
        this.bubbleMenuItems.find(x => x.id == "edit")!.visible = true;
      } else {
        this.bubbleMenuItems.find(x => x.id == "edit")!.visible = false;
      }
    } else {
      this.bubbleMenuItems.forEach(x => x.visible = false);

      this.bubbleMenuItems.find(x => x.id == "select")!.visible = true;
    }

    this.onContextMenu.emit({ mouseEvent, isBubble });

    this.contextMenu.show(mouseEvent);
  }

  protected onMessageClick(event: MouseEvent, isBubble: boolean) {
    if (this.isSelectionModeOn) {
      if (this.isSelected) {
        console.log('unselect', this.message)
        this.onUnselect.emit();
      } else {
        console.log('select')
        this.onSelect.emit();
      }
    }
  }

  protected bubbleMenuItems: MenuItem[] = [
    {
      id: 'reply',
      label: 'Reply',
      icon: 'pi pi-fw pi-reply',
      iconStyle: { 'transform': 'scaleX(-1.0)', },
    },
    {
      id: 'edit',
      label: 'Edit',
      icon: 'pi pi-fw pi-pencil',
      command: () => {
        this.message.chat.messageToEdit$.next(this.message);
      }
    },
    {
      id: 'pin',
      label: 'Pin',
      icon: 'pi pi-fw pi-bookmark',
    },
    {
      id: 'copy',
      label: 'Copy',
      icon: 'pi pi-fw pi-copy',
      command: (event: MenuItemCommandEvent) => {
        this.onCopy.emit();
      }
    },
    {
      id: 'copy',
      label: 'Copy selected text',
      icon: 'pi pi-fw pi-copy',
      command: (event: MenuItemCommandEvent) => {
        this.onCopy.emit();
      }
    },
    {
      id: 'forward',
      label: 'Forward',
      icon: 'pi pi-fw pi-reply',
    },
    {
      label: 'Delete',
      icon: 'pi pi-fw pi-trash',

      command: () => {
        this.onDelete.emit();
      }
    },
    {
      id: 'select',
      label: 'Select',
      icon: 'pi pi-fw pi-check',
      command: (event: MenuItemCommandEvent) => {
        this.onSelect.emit();
      }
    },
    {
      id: 'unselect',
      label: 'Cancel selection',
      icon: 'pi pi-fw pi-check',
      command: (event: MenuItemCommandEvent) => {
        this.onUnselect.emit();
      }
    },
  ];
}
