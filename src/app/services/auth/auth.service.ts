import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {SignInDto} from "../../models/auth/signInDto";
import {SignUpDto} from "../../models/auth/signUpDto";
import {Router} from "@angular/router";
import {IUser} from "../../models/auth/user";
import {catchError, tap, throwError} from "rxjs";
import {IApiResult} from "../../models/common/apiResult";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private httpClient: HttpClient, private router: Router) {

  }

  public user: IUser | null = null;

  signIn(signInDto: SignInDto) {
    return this.httpClient.post<IApiResult>("/api/auth/signin", signInDto, { withCredentials: true, })
      .pipe(
        tap(apiResult => {
          if (!apiResult.succeeded)
            return;

          this.loadUser()
            .subscribe({
              next: user => {
                this.router.navigate([`/profile`, user.username]);
              }
            })
        }),
      );
  }

  signOut() {
    return this.httpClient.get<any>("/api/auth/signout", { withCredentials: true, })
      .pipe(
        tap(value => {
          this.router.navigate(['/auth/sign-in']);
        })
      );
  }

  signUp(signUpDto: SignUpDto) {
    return this.httpClient.post<any>("/api/auth/signup", signUpDto, { withCredentials: true, });
  }

  loadUser() {
    return this.httpClient.get<IUser>("/api/user", { withCredentials: true, })
      .pipe(
        tap(value => this.user = value),
      );
  }

  isSignedIn() { return this.user != null };
}
