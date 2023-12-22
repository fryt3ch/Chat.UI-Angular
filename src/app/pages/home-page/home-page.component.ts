import {Component} from '@angular/core';
import {AuthService} from "../../services/auth/auth.service";
import {Router} from "@angular/router";
import {ThemeService} from "../../services/general/theme.service";
import {getLanguageByCode, getLanguageProperties, Language} from "../../models/common/language.enum";
import {DropdownChangeEvent} from "primeng/dropdown";
import {TranslateService} from "@ngx-translate/core";
import {tap} from "rxjs";

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent {

  protected languageTypes: Language[] = Object.values(Language).filter(value => typeof value === 'number').map(value => <Language>value);

  protected selectedLanguage: Language;

  constructor(
    protected authService: AuthService,
    protected router: Router,
    protected themeService: ThemeService,
    private translateService: TranslateService
  ) {
    this.selectedLanguage = this.languageTypes.find(x => x == this.getCurrentLanguage()) as Language;
  }

  protected signOutBtnAction() {
    this.authService.signOut()
      .subscribe();
  }

  protected toggleTheme() {
    const currentTheme = this.themeService.currentTheme;

    if (currentTheme === 'dark')
      this.themeService.setTheme('light', true);
    else if (currentTheme === 'light')
      this.themeService.setTheme('sys-auto', true);
    else if (currentTheme === 'sys-auto')
      this.themeService.setTheme('dark', true);
  }

  protected setLanguage(event: DropdownChangeEvent) {
    const value = event.value as Language;

    this.selectedLanguage = value;

    let langProps = getLanguageProperties(value);

    this.translateService.use(langProps.code)
      .pipe(
        tap(value => {
          localStorage.setItem('app-lang', langProps.code);
        })
      )
      .subscribe();
  }

  protected getCurrentLanguage() {
    return getLanguageByCode(this.translateService.currentLang);
  }

  protected getCurrentThemeIcon() {
    const currentTheme = this.themeService.currentTheme;

    if (currentTheme === 'dark')
      return 'pi pi-moon';
    else if (currentTheme === 'light')
      return 'pi pi-sun';

    return 'pi pi-cog';
  }

  protected readonly Language = Language;
  protected readonly getLanguageProperties = getLanguageProperties;
}
