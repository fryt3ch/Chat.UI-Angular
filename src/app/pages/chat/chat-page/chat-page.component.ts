import {AfterViewInit, Component, DestroyRef, ElementRef, OnInit, ViewChild} from '@angular/core';
import * as signalR from '@microsoft/signalr';
import {environment} from "../../../../environments/environment";
import {ChatService} from "../../../services/chat/chat.service";
import {debounceTime, filter, fromEvent, map, Observable, Subject, tap} from "rxjs";
import {Chat} from "../../../models/chat/chat";
import {ContextMenu} from "primeng/contextmenu";
import {DialogService, DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";
import {
  ChatMemberProfileModalComponent
} from "../../../components/chat/chat-member-profile-modal/chat-member-profile-modal.component";
import {UserProfileService} from "../../../services/user-profile/user-profile.service";
import {ActivatedRoute} from "@angular/router";
import {AuthService} from "../../../services/auth/auth.service";
import {ChatHubService} from "../../../services/chat/chat-hub.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-chat-page',
  templateUrl: './chat-page.component.html',
  styleUrls: ['./chat-page.component.scss'],
})
export class ChatPageComponent implements OnInit, AfterViewInit {
  @ViewChild('contextMenu') contextMenuElement!: ContextMenu;

  constructor(
    private route: ActivatedRoute,
    protected chatService: ChatService,
    protected chatHubService: ChatHubService,
    protected userProfileService: UserProfileService,
    private authService: AuthService,
    private destroyRef: DestroyRef,
  ) {

  }

  ngOnInit() {
    const id = this.route.snapshot.params['id'];

    this.authService.isSignedIn$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(value => {
        if (value) {
          this.chatHubService.startConnection();
        } else {
          this.chatHubService.stopConnection();
        }
      });
  }

  ngAfterViewInit() {
    this.chatService.contextMenuElement = this.contextMenuElement;
  }

  ngOnDestroy() {

  }
}
