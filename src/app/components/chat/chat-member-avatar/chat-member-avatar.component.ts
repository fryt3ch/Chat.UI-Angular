import {Component, Input, OnInit} from '@angular/core';
import {catchError, concatMap, EMPTY, interval, Observable, of} from "rxjs";

@Component({
  selector: 'app-chat-member-avatar',
  templateUrl: './chat-member-avatar.component.html',
  styleUrls: ['./chat-member-avatar.component.scss']
})
export class ChatMemberAvatarComponent implements OnInit {
  @Input() public avatarUrl$: Observable<string> | undefined;
  @Input() public displayName: string = '';
  @Input() public isOnline: boolean | undefined;
  @Input() public color: string = '#5DADDF';

  @Input() public size: "normal" | "large" | "xlarge" = "normal";

  initials: string = '';

  constructor() {

  }

  ngOnInit(): void {
    if (this.avatarUrl$) {
      this.avatarUrl$ = this.avatarUrl$.pipe(
          catchError((err, x) => {
            return EMPTY;
          })
      );
    }

    this.initials = this.getInitials();
  }

  public getInitials(): string {
    if (this.displayName.length > 0) {
      let split = this.displayName.split(' ');

      if (split.length > 1)
        return split[0][0] + split[1][0];

      return this.displayName[0];
    }

    return '';
  }
}
