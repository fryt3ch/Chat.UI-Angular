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
  @Input({ required: true, }) public chat!: Chat;

  protected isActive: boolean = false;

  constructor(private chatService: ChatService) {
    this.chatService.activeChat$
        .subscribe(x => {
          if (x) {
            this.isActive = true;
          } else {
            if (this.isActive)
              this.isActive = false;
          }
        })
  }

  protected readonly getUserProfileColorProperties = getUserProfileColorProperties;
}
