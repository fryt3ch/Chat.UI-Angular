import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Chat, UserChat} from "../../../models/chat/chat";
import {MenuItem} from "primeng/api";
import {ChatService} from "../../../services/chat/chat.service";
import {getUserProfileColorProperties} from "../../../models/common/user-profile-color.enum";
import {ChatMessage} from "../../../models/chat/chat-message";
import {DatePipe} from "@angular/common";
import {Observable} from "rxjs";

@Component({
  selector: 'app-chat-preview-element',
  templateUrl: './chat-preview-element.component.html',
  styleUrls: ['./chat-preview-element.component.scss'],
  providers: [DatePipe],
})
export class ChatPreviewElementComponent implements OnInit, OnChanges {
  @Input() isSelected: boolean = false;
  @Input() message?: ChatMessage;
  @Input() unreadMessagesAmount: number = 0;
  @Input() avatarUrl$?: Observable<string>;
  @Input() displayName: string = '';
  @Input() isOnline: boolean = false;
  @Input() avatarColorHex: string = '#000000';
  @Input() statusText?: string;

  protected timeText: string = '';

  constructor(private chatService: ChatService, private datePipe: DatePipe) {

  }

  ngOnInit() {

  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['message']) {
      const change = changes['message'];

      if (this.message) {
        this.timeText = this.getChatTimeString(this.message)
      } else {
        this.timeText = '';
      }
    }
  }

  protected getChatTimeString(message: ChatMessage): string {
    const date = message.sentAt;

    const currentDate = new Date(Date.now());

    if (date.getFullYear() === currentDate.getFullYear()) {
      const timeDiff = Math.abs(date.getTime() - currentDate.getTime());
      const daysDiff = timeDiff / (1000 * 3600 * 24);

      if (daysDiff < 7) {
        if (daysDiff < 1) {
          return this.datePipe.transform(date, 'HH:mm')!;
        }

        return this.datePipe.transform(date, 'EEE')!;
      }

      return this.datePipe.transform(date, 'MMM d')!;
    } else {
      return this.datePipe.transform(date, 'MM/dd/yyyy')!;
    }
  }
}
