import {Component, ElementRef, Input, ViewChild} from '@angular/core';
import {Observable, Subject} from "rxjs";
import {ThemeService} from "../../services/general/theme.service";

@Component({
  selector: 'app-emoji-picker',
  templateUrl: './emoji-picker.component.html',
  styleUrls: ['./emoji-picker.component.scss']
})
export class EmojiPickerComponent {
  isOpened = false;
  //theme$: Observable<string>;
  @Input() emojiInput$: Subject<string> | undefined;
  @ViewChild("container") container: ElementRef<HTMLElement> | undefined;

  constructor(themeService: ThemeService) {
    //this.theme$ = themeService.theme$;
  }

  emojiSelected(event: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    this.emojiInput$?.next(event.emoji.native);
  }

  eventHandler = (event: Event) => {
    // Watching for outside clicks
    if (!this.container?.nativeElement.contains(event.target as Node)) {
      this.isOpened = false;

      window.removeEventListener("click", this.eventHandler);
    }
  };

  toggled() {
    if (!this.container) {
      return;
    }

    if (this.isOpened) {
      this.isOpened = false;

      window.removeEventListener("click", this.eventHandler);
    } else {
      this.isOpened = true;

      window.addEventListener("click", this.eventHandler);
    }
  }
}
