import {Component, Input, OnInit} from '@angular/core';
import {ActivatedRouteSnapshot, Navigation, Router} from "@angular/router";

@Component({
  selector: 'app-not-found-page',
  templateUrl: './not-found-page.component.html',
  styleUrls: ['./not-found-page.component.scss']
})
export class NotFoundPageComponent implements OnInit {
  @Input()
  public messageTranslation: string = "pageNotFound.message";

  @Input()
  public hintTranslation: string = "pageNotFound.hint";

  @Input()
  public returnUrl: string | undefined = undefined;

  @Input()
  public returnBtnTextTranslation: string = '';

  constructor(protected router: Router) {

  }

  ngOnInit(): void {
    this.returnBtnTextTranslation = this.returnUrl ? "pageNotFound.returnBtnText.back" : "pageNotFound.returnBtnText.backToHomePage";
  }

  returnBtnAction() {
    if (this.returnUrl) {
      this.router.navigate([this.returnUrl]);
    }
    else {
      this.router.navigate(['']);
    }
  }
}
