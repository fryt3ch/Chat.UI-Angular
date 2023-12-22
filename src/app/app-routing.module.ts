import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {SignInPageComponent} from "./pages/auth/signin-page/signin-page.component";
import {SignUpPageComponent} from "./pages/auth/signup-page/signup-page.component";
import {UserProfilePageComponent} from "./pages/user-profile/user-profile-page/user-profile-page.component";
import {notSignedInGuard, signedInGuard} from "./interceptors/guards/signed-in.guard";
import {ChatPageComponent} from "./pages/chat/chat-page/chat-page.component";
import {NotFoundPageComponent} from "./pages/errors/not-found-page/not-found-page.component";
import {HomePageComponent} from "./pages/home-page/home-page.component";

const routes: Routes = [
  { path: '', component: HomePageComponent, },

  {
    path: 'auth',

    children: [
      { path: '', redirectTo: 'sign-in', pathMatch: 'full' },
      { path: 'sign-in', component: SignInPageComponent, canActivate: [notSignedInGuard] },
      { path: 'sign-up', component: SignUpPageComponent, canActivate: [notSignedInGuard] },
    ]
  },

  { path: 'profile/:username', component: UserProfilePageComponent, },

  { path: 'chat/:id', component: ChatPageComponent, canActivate: [signedInGuard] },
  { path: 'chat', component: ChatPageComponent, canActivate: [signedInGuard] },

  { path: '**', component: NotFoundPageComponent, },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {

  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
