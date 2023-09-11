import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {SignInPageComponent} from "./pages/auth/signin-page/signin-page.component";
import {SignUpPageComponent} from "./pages/auth/signup-page/signup-page.component";
import {UserProfilePageComponent} from "./pages/user/user-profile-page/user-profile-page.component";
import {notSignedInGuard, signedInGuard} from "./interceptors/guards/signed-in.guard";
import {ChatPageComponent} from "./pages/chat/chat-page/chat-page.component";

const routes: Routes = [
  { path: 'auth', redirectTo: 'auth/sign-in' },
  { path: 'auth/sign-in', component: SignInPageComponent, canActivate: [notSignedInGuard] },
  { path: 'auth/sign-up', component: SignUpPageComponent, canActivate: [notSignedInGuard] },

  { path: 'profile/:username', component: UserProfilePageComponent, canActivate: [signedInGuard] },

  { path: 'chat', component: ChatPageComponent, canActivate: [signedInGuard] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
