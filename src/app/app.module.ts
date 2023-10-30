import {APP_INITIALIZER, NgModule} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SignInPageComponent } from './pages/auth/signin-page/signin-page.component';
import {HTTP_INTERCEPTORS, HttpClient, HttpClientModule} from "@angular/common/http";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import { SignUpPageComponent } from './pages/auth/signup-page/signup-page.component';
import { UserProfilePageComponent } from './pages/user-profile/user-profile-page/user-profile-page.component';
import {ErrorInterceptor} from "./interceptors/error.interceptor";
import {InitializerService} from "./services/initializer.service";
import { ChatPageComponent } from './pages/chat/chat-page/chat-page.component';
import {LowercaseUrlSerializer} from "./interceptors/lowercase-url.serializer";
import {RouteReuseStrategy as RouteReuseStrategyProvider, UrlSerializer} from "@angular/router";
import {ToastrModule} from "ngx-toastr";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {TranslateLoader, TranslateModule} from "@ngx-translate/core";
import {TranslateHttpLoader} from "@ngx-translate/http-loader";
import { NotFoundPageComponent } from './pages/errors/not-found-page/not-found-page.component';
import {RouteReuseStrategy} from "./interceptors/route-reuse.strategy";
import { CreateUserProfilePageComponent } from './pages/user-profile/create-user-profile-page/create-user-profile-page.component';
import { CastPipe } from './pipes/cast.pipe';
import {ApiResultInterceptor} from "./interceptors/api-result.interceptor";
import {InputTextModule} from "primeng/inputtext";
import {PasswordModule} from "primeng/password";
import {CheckboxModule} from "primeng/checkbox";
import {ButtonModule} from "primeng/button";
import {AutoFocusModule} from "primeng/autofocus";
import {DropdownModule} from "primeng/dropdown";
import {CalendarModule} from "primeng/calendar";
import {SelectButtonModule} from "primeng/selectbutton";
import {FileUploadModule} from "primeng/fileupload";
import { ProgressSpinnerComponent } from './components/progress-spinner/progress-spinner.component';
import {ProgressSpinnerModule} from "primeng/progressspinner";
import { HomePageComponent } from './pages/home-page/home-page.component';
import {ToolbarModule} from "primeng/toolbar";
import {ToggleButtonModule} from "primeng/togglebutton";
import {AvatarModule} from "primeng/avatar";
import {SplitterModule} from "primeng/splitter";
import { ChatPreviewElementComponent } from './components/chat/chat-preview-element/chat-preview-element.component';
import { ChatPreviewPanelComponent } from './components/chat/chat-preview-panel/chat-preview-panel.component';
import { ChatViewPanelComponent } from './components/chat/chat-view-panel/chat-view-panel.component';
import {VirtualScrollerModule} from "primeng/virtualscroller";
import {ScrollPanelModule} from "primeng/scrollpanel";
import {PickListModule} from "primeng/picklist";
import {ContextMenuModule} from "primeng/contextmenu";
import {InputTextareaModule} from "primeng/inputtextarea";
import { ScrollingModule } from '@angular/cdk/scrolling';
import {
  ChatMessagesVirtualScrollDirective
} from "./interceptors/scroll-strategies/chat-messages-virtual-scroll.directive";
import { ChatMessageComponent } from './components/chat/chat-message/chat-message.component';
import { ChatMemberAvatarComponent } from './components/chat/chat-member-avatar/chat-member-avatar.component';
import {SkeletonModule} from "primeng/skeleton";
import {PickerComponent as EmojiMartPickerComponent} from "@ctrl/ngx-emoji-mart";
import { EmojiPickerComponent } from './components/emoji-picker/emoji-picker.component';
import {MenuModule} from "primeng/menu";
import {
    AutoSizeVirtualScrollStrategy,
    RxVirtualFor,
    RxVirtualScrollViewportComponent
} from "@rx-angular/template/experimental/virtual-scrolling";
import {RxLet} from "@rx-angular/template/let";
import {RxIf} from "@rx-angular/template/if";
import {BadgeModule} from "primeng/badge";
import {ConfirmDialogModule} from "primeng/confirmdialog";

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
    NotFoundPageComponent,
    CreateUserProfilePageComponent,
    CastPipe,
    ProgressSpinnerComponent,
    HomePageComponent,
    ChatPreviewElementComponent,
    ChatPreviewPanelComponent,
    ChatViewPanelComponent,
    ChatMessagesVirtualScrollDirective,
    ChatMessageComponent,
    ChatMemberAvatarComponent,
    EmojiPickerComponent,
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
        ReactiveFormsModule,
        InputTextModule,
        PasswordModule,
        CheckboxModule,
        ButtonModule,
        AutoFocusModule,
        DropdownModule,
        CalendarModule,
        SelectButtonModule,
        FileUploadModule,
        ProgressSpinnerModule,
        ToolbarModule,
        ToggleButtonModule,
        AvatarModule,
        SplitterModule,
        VirtualScrollerModule,
        ScrollPanelModule,
        PickListModule,
        ContextMenuModule,
        InputTextareaModule,
        ScrollingModule,
        SkeletonModule,
        EmojiMartPickerComponent,
        MenuModule,
        RxVirtualScrollViewportComponent,
        RxVirtualFor,
        AutoSizeVirtualScrollStrategy,
        RxLet,
        RxIf,
        BadgeModule,
        ConfirmDialogModule
    ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ApiResultInterceptor,
      multi: true
    },
/*    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    },*/
    {
      provide: APP_INITIALIZER,
      useFactory: (initializerService: InitializerService) => () => initializerService.initialize(),
      deps: [InitializerService],
      multi: true
    },
    {
      provide: UrlSerializer,
      useClass: LowercaseUrlSerializer
    },
    {
      provide: RouteReuseStrategyProvider,
      useClass: RouteReuseStrategy,
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
