import {Component, OnInit} from '@angular/core';
import {AuthService} from "./services/auth/auth.service";
import {finalize, lastValueFrom, tap} from "rxjs";
import {ThemeService} from "./services/general/theme.service";
import {TranslateService} from "@ngx-translate/core";
import {getLanguageByCode, getLanguageProperties} from "./models/common/language.enum";

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
}
