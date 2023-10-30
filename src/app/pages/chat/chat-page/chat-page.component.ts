import {Component, OnInit} from '@angular/core';
import * as signalR from '@microsoft/signalr';
import {environment} from "../../../../environments/environment";
import {ChatService} from "../../../services/chat/chat.service";
import {tap} from "rxjs";
import {Chat} from "../../../models/chat/chat";

@Component({
  selector: 'app-chat-page',
  templateUrl: './chat-page.component.html',
  styleUrls: ['./chat-page.component.scss']
})
export class ChatPageComponent implements OnInit {
  constructor(protected chatService: ChatService) {

  }

   ngOnInit() {

   }
}
