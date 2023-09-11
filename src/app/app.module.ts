import {APP_INITIALIZER, NgModule} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SignInPageComponent } from './pages/auth/signin-page/signin-page.component';
import {HTTP_INTERCEPTORS, HttpClient, HttpClientModule} from "@angular/common/http";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import { SignUpPageComponent } from './pages/auth/signup-page/signup-page.component';
import { UserProfilePageComponent } from './pages/user/user-profile-page/user-profile-page.component';
import {ErrorInterceptor} from "./interceptors/error.interceptor";
import {InitializerService} from "./services/initializer.service";
import { ChatPageComponent } from './pages/chat/chat-page/chat-page.component';
import {LowerCaseUrlSerializer} from "./interceptors/lowercaseUrlSerializer";
import {UrlSerializer} from "@angular/router";
import {ToastrModule} from "ngx-toastr";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {TranslateLoader, TranslateModule} from "@ngx-translate/core";
import {TranslateHttpLoader} from "@ngx-translate/http-loader";

export function HttpLoaderFactory(http: HttpClient): TranslateLoader {
  return new TranslateHttpLoader(http, './assets/locale/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    SignInPageComponent,
    SignUpPageComponent,
    UserProfilePageComponent,
    ChatPageComponent,
  ],
  imports: [
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
      defaultLanguage: "en",
      useDefaultLang: true,
    }),
    BrowserAnimationsModule,
    ToastrModule.forRoot({
      timeOut: 7_500,
      positionClass: 'toast-top-right',
      preventDuplicates: false,
    }),

    HttpClientModule,
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (initializerService: InitializerService) => () => initializerService.initialize(),
      deps: [InitializerService],
      multi: true
    },
    {
      provide: UrlSerializer,
      useClass: LowerCaseUrlSerializer
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
