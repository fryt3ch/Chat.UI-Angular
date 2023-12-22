import { Component } from '@angular/core';
import {ChatService} from "../../../services/chat/chat.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-chat-menu-panel',
  templateUrl: './chat-menu-panel.component.html',
  styleUrls: ['./chat-menu-panel.component.scss']
})
export class ChatMenuPanelComponent {

  constructor(
    private chatService: ChatService,
    protected router: Router,
  ) {

  }


  profileClick() {
    const userProfile = this.chatService.userProfileService.userProfile;

    if (userProfile) {
      this.chatService.setActiveChatMemberProfile(userProfile);
    }
  }

  settingsClick() {

  }

  createChatClick() {

  }

  homeClick() {
    this.router.navigate(['/']);
  }
}
