import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {SignInDto} from "../../models/auth/sign-in-dto";
import {SignUpDto} from "../../models/auth/sign-up-dto";
import {Router} from "@angular/router";
import {User} from "../../models/auth/user";
import {catchError, tap, throwError} from "rxjs";
import {ApiResult} from "../../models/common/api-result";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private httpClient: HttpClient, private router: Router) {

  }

  public user: User | null = null;

  signIn(signInDto: SignInDto) {
    return this.httpClient.post<ApiResult>("/api/auth/signin", signInDto, { withCredentials: true, })
      .pipe(
        tap((apiResult) => {
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
    return this.httpClient.post<ApiResult>("/api/auth/signout", null, { withCredentials: true, })
      .pipe(
        tap((apiResult) => {
          this.router.navigate(['/auth/sign-in']);
        })
      );
  }

  signUp(signUpDto: SignUpDto) {
    return this.httpClient.post<ApiResult>("/api/auth/signup", signUpDto, { withCredentials: true, })
      .pipe(
        tap((apiResult) => {
        })
      );
  }

  loadUser() {
    return this.httpClient.get<User>("/api/user", { withCredentials: true, })
      .pipe(
        tap(value => this.user = value),
      );
  }

  isSignedIn() { return this.user != null };
}
