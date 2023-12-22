import {Component, ComponentRef, EventEmitter, Input, Optional, Output} from '@angular/core';
import {ChatService} from "../../../services/chat/chat.service";
import {Chat} from "../../../models/chat/chat";
import {DynamicDialogComponent, DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";
import {getUserProfileColorProperties} from "../../../models/common/user-profile-color.enum";

@Component({
  selector: 'app-chat-picker-modal',
  templateUrl: './chat-picker-modal.component.html',
  styleUrls: ['./chat-picker-modal.component.scss']
})
export class ChatPickerModalComponent {
  protected chats!: Chat[];

  @Input('headerTitleText') public headerTitleText: string = 'Select chat...';

  @Output() public chatPicked: EventEmitter<{ chatId: string, }> = new EventEmitter<{chatId: string}>();

  constructor(
    @Optional() private ref: DynamicDialogRef,
    @Optional() private config: DynamicDialogConfig,
    private chatService: ChatService
  ) {
    if (config.data) {
      this.chatPicked = config.data.chatPicked;
    }
  }

  ngOnInit() {
    this.chatService.chats$.subscribe(chats => {
      this.chats = chats;
    });
  }

  protected onCloseBtnClick() {
    if (this.ref) {
      this.ref.close();
    }
  }

  protected readonly getUserProfileColorProperties = getUserProfileColorProperties;
}
