import {Component, OnInit} from '@angular/core';
import {AuthService} from "./services/auth/auth.service";
import {finalize, lastValueFrom, tap} from "rxjs";
import {ThemeService} from "./services/general/theme.service";
import {TranslateService} from "@ngx-translate/core";
import {getLanguageByCode, getLanguageProperties} from "./models/common/language.enum";
import {userProfileColors} from "./models/common/user-profile-color.enum";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(private authService: AuthService, private themeService: ThemeService, private translateService: TranslateService) {
  }

  ngOnInit() {
    this.themeService.initialize();

    this.initializeLanguage();
    this.initializeUserProfileColors();
  }

  private initializeLanguage() {
    const appLangKey = 'app-lang';

    let storedLang = localStorage.getItem(appLangKey);

    if (storedLang) {
      let language = getLanguageByCode(storedLang);

      if (language) {
        this.translateService.use(getLanguageProperties(language).code);
      }
    }
    else {
      let browserLang = this.translateService.getBrowserLang();

      if (browserLang) {
        let language = getLanguageByCode(browserLang);

        if (language) {
          let props = getLanguageProperties(language);

          this.translateService.use(props.code);

          localStorage.setItem(appLangKey, props.code)
        }
      }
    }
  }

  private initializeUserProfileColors() {
    userProfileColors.forEach((value, key) =>  {
      window.document.documentElement.style.setProperty(`--peer-${key}-color-rgb`, `${value.rgb.r}, ${value.rgb.g}, ${value.rgb.b}`);
    });

    window.document.documentElement.style.setProperty('--peer-out-color-rgb', '255, 255, 255');
  }
}
