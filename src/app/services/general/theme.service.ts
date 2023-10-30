import {inject, Inject, Injectable, Injector} from '@angular/core';
import {DOCUMENT} from "@angular/common";
import {BehaviorSubject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private _currentTheme$ = new BehaviorSubject<string>('dark');
  private _currentSystemThemeWatcherFunc: any;
  private readonly _systemThemeQuery: MediaQueryList | undefined;

  public get currentTheme() {
    return this._currentTheme$.value;
  };

  public get currentTheme$() { return this._currentTheme$.asObservable(); };

  constructor(@Inject(DOCUMENT) private document: Document) {
    if (window.matchMedia !== undefined)
      this._systemThemeQuery = window.matchMedia('(prefers-color-scheme: light)');
  }

  public setTheme(theme: string, updateLocalStorage: boolean = true) {
    this.stopSystemThemeWatcher();

    if (theme == 'sys-auto') {
      const sysTheme = this.getSystemTheme();

      if (sysTheme)
        this.setTheme(sysTheme, false);

      this.startSystemThemeWatcher();
    }
    else {
      this.updateTheme(theme);
    }

    this._currentTheme$.next(theme);

    if (updateLocalStorage)
      localStorage.setItem('app-theme', theme);
  }

  public updateTheme(theme: string) {
    var elem = document.getElementById('app-theme') as HTMLLinkElement;

    if (theme === 'dark') {
      elem.href = "assets/themes/dark/theme.css";
    }
    else if (theme === 'light') {
      elem.href = "assets/themes/light/theme.css";
    }
  }

  public getSystemTheme(): string | undefined {
    if (!this._systemThemeQuery)
      return undefined;

    return this._systemThemeQuery.matches ? 'light' : 'dark';
  };

  public getUserTheme(): string | undefined {
    let theme = localStorage.getItem("app-theme");

    if (theme) {
      return theme;
    }

    return undefined;
  }

  private startSystemThemeWatcher(): boolean {
    if (!this._systemThemeQuery)
      return false;

    this._currentSystemThemeWatcherFunc = this.onSystemThemeChange.bind(this);

    this._systemThemeQuery.addEventListener('change', this._currentSystemThemeWatcherFunc);

    return true;
  }

  private onSystemThemeChange(event: MediaQueryListEvent) {
    const newTheme = event.matches ? "light" : "dark";

    this.updateTheme(newTheme);
  }

  private stopSystemThemeWatcher() {
    if (!this._currentSystemThemeWatcherFunc || !this._systemThemeQuery)
      return;

    this._systemThemeQuery.removeEventListener('change', this._currentSystemThemeWatcherFunc);
  }

  public initialize() {
    let userTheme = this.getUserTheme();

    if (userTheme) {
      this.setTheme(userTheme, false);
    } else {
      let systemTheme = this.getSystemTheme();

      if (systemTheme) {
        this.setTheme('sys-auto', true);
      } else {
        this.setTheme('dark', true);
      }
    }
  }
}
