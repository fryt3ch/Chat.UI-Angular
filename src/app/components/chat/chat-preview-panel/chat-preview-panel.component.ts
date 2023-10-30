import { Component, OnInit, ViewChild} from '@angular/core';
import {ChatService} from "../../../services/chat/chat.service";
import {Chat} from "../../../models/chat/chat";
import {CdkVirtualScrollViewport} from "@angular/cdk/scrolling";
import {MenuItem} from "primeng/api";
import {ContextMenu} from "primeng/contextmenu";

@Component({
  selector: 'app-chat-preview-panel',
  templateUrl: './chat-preview-panel.component.html',
  styleUrls: ['./chat-preview-panel.component.scss']
})
export class ChatPreviewPanelComponent implements OnInit {
  @ViewChild('chatsScrollViewport') chatsScrollViewport!: CdkVirtualScrollViewport;
  @ViewChild('chatPreviewContextMenu') chatPreviewContextMenu!: ContextMenu;

  constructor(protected chatService: ChatService) {
  }

  ngOnInit() {

  }

  protected onChatClick(chat: Chat) {
    if (this.chatService.selectedChat == chat)
      return;

    this.chatService.setSelectedChat(chat);
  }

  protected onContextMenu(event: MouseEvent, chat: Chat) {
    console.log(chat);

    this.chatPreviewContextMenu.show(event);
  }

  protected t = [
    {
      label: 'File',
      icon: 'pi pi-fw pi-file',
      command: () => { console.log("asd") },
      items: [
        {
          label: 'New',
          icon: 'pi pi-fw pi-plus',
          items: [
            {
              label: 'Bookmark',
              icon: 'pi pi-fw pi-bookmark'
            },
            {
              label: 'Video',
              icon: 'pi pi-fw pi-video'
            }
          ]
        },
        {
          label: 'Delete',
          icon: 'pi pi-fw pi-trash'
        },
        {
          separator: true
        },
        {
          label: 'Export',
          icon: 'pi pi-fw pi-external-link'
        }
      ]
    },
    {
      label: 'Edit',
      icon: 'pi pi-fw pi-pencil',
      items: [
        {
          label: 'Left',
          icon: 'pi pi-fw pi-align-left'
        },
        {
          label: 'Right',
          icon: 'pi pi-fw pi-align-right'
        },
        {
          label: 'Center',
          icon: 'pi pi-fw pi-align-center'
        },
        {
          label: 'Justify',
          icon: 'pi pi-fw pi-align-justify'
        }
      ]
    },
    {
      label: 'Users',
      icon: 'pi pi-fw pi-user',
      items: [
        {
          label: 'New',
          icon: 'pi pi-fw pi-user-plus'
        },
        {
          label: 'Delete',
          icon: 'pi pi-fw pi-user-minus'
        },
        {
          label: 'Search',
          icon: 'pi pi-fw pi-users',
          items: [
            {
              label: 'Filter',
              icon: 'pi pi-fw pi-filter',
              items: [
                {
                  label: 'Print',
                  icon: 'pi pi-fw pi-print'
                }
              ]
            },
            {
              icon: 'pi pi-fw pi-bars',
              label: 'List'
            }
          ]
        }
      ]
    },
    {
      label: 'Events',
      icon: 'pi pi-fw pi-calendar',
      items: [
        {
          label: 'Edit',
          icon: 'pi pi-fw pi-pencil',
          items: [
            {
              label: 'Save',
              icon: 'pi pi-fw pi-calendar-plus'
            },
            {
              label: 'Delete',
              icon: 'pi pi-fw pi-calendar-minus'
            }
          ]
        },
        {
          label: 'Archieve',
          icon: 'pi pi-fw pi-calendar-times',
          items: [
            {
              label: 'Remove',
              icon: 'pi pi-fw pi-calendar-minus'
            }
          ]
        }
      ]
    },
    {
      separator: true
    },
    {
      label: 'Quit',
      icon: 'pi pi-fw pi-power-off'
    }
  ];
}
