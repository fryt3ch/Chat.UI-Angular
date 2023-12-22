import {Component, Input, OnDestroy, OnInit, Optional} from '@angular/core';
import {DialogService, DynamicDialogRef} from "primeng/dynamicdialog";
import {ChatService} from "../../../services/chat/chat.service";
import {Observable, of} from "rxjs";
import {QrcodeModalComponent} from "../../qrcode-modal/qrcode-modal.component";
import {DialogRef} from "@angular/cdk/dialog";
import {UserProfile} from "../../../models/user-profile/user-profile";

@Component({
  selector: 'app-chat-member-profile-modal',
  templateUrl: './chat-member-profile-modal.component.html',
  styleUrls: ['./chat-member-profile-modal.component.scss'],
  providers: [DialogService],
})
export class ChatMemberProfileModalComponent implements OnInit, OnDestroy {
  member!: UserProfile;

  photos: { src$: Observable<string>, }[] = [];

  isFullscreenPhotoViewOn: boolean = true;
  isMultiplePhotosViewOn: boolean = false;

  private qrCodeModalDialogueRef: DynamicDialogRef | undefined;

  constructor(
    private dialogueService: DialogService,
    @Optional() private ref: DynamicDialogRef,
    private chatService: ChatService
  ) {

  }

  ngOnInit(): void {
    this.chatService.activeChatMemberProfile$.subscribe(value => {
      if (value) {
        this.member = value;

        if (this.member.avatarPhotoUrl$)
          this.photos = [{ src$: this.member.avatarPhotoUrl$, }];
      }
    });

    if (this.ref) {
      this.ref.onClose.subscribe(value => {
        if (this.qrCodeModalDialogueRef) {
          this.qrCodeModalDialogueRef.close();
        }
      });
    }
  }

  ngOnDestroy() {

  }

  onCloseBtnClick() {
    if (this.ref) {
      this.ref.close();
    }
  }

  onInfoSectionUsernameClick(event: MouseEvent, username: string) {
    of(navigator.clipboard.writeText(username)).subscribe();
  }

  onInfoSectionQrCodeClick(event: MouseEvent) {
    event.stopPropagation();

    this.qrCodeModalDialogueRef = this.dialogueService.open(QrcodeModalComponent, {
      showHeader: false,
      dismissableMask: true,
    });

    const dialogRef = this.dialogueService.dialogComponentRefMap.get(this.qrCodeModalDialogueRef)!;

    dialogRef.changeDetectorRef.detectChanges();

    const componentRef = dialogRef.instance.componentRef!;

    componentRef.setInput('qrData', `${'https://test-app.com'}/@${this.member.username}`);
  }
}
