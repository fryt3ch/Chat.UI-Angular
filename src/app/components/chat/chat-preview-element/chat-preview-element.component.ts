import {Component, Input} from '@angular/core';
import {Chat, UserChat} from "../../../models/chat/chat";
import {MenuItem} from "primeng/api";
import {ChatService} from "../../../services/chat/chat.service";
import {getUserProfileColorProperties} from "../../../models/common/user-profile-color.enum";

@Component({
  selector: 'app-chat-preview-element',
  templateUrl: './chat-preview-element.component.html',
  styleUrls: ['./chat-preview-element.component.scss']
})
export class ChatPreviewElementComponent {
  @Input({ required: true, })
  public chat!: Chat;

  constructor(private chatService: ChatService) {

  }

  protected isChatSelected() {
    return this.chatService.selectedChat == this.chat;
  }

    protected readonly UserChat = UserChat;
    protected readonly getUserProfileColorProperties = getUserProfileColorProperties;
}
