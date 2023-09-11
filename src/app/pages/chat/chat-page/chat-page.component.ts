import {Component, OnInit} from '@angular/core';
import * as signalR from '@microsoft/signalr';
import {environment} from "../../../../environments/environment";

@Component({
  selector: 'app-chat-page',
  templateUrl: './chat-page.component.html',
  styleUrls: ['./chat-page.component.scss']
})
export class ChatPageComponent implements OnInit {

  constructor() {
  }
   ngOnInit() {
     const connection = new signalR.HubConnectionBuilder()
       .configureLogging(signalR.LogLevel.Debug)
       .withUrl("/hubs/chat")
       .build();

     connection.start()
       .then(() => {
         console.log("SignalR connected!");
       })
       .catch((err) => {
         return console.error(err.toString());
       });
  }
}
