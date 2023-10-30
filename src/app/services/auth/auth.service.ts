import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {SignInRequestDto} from "../../models/auth/sign-in-request-dto";
import {SignUpRequestDto} from "../../models/auth/sign-up-request-dto";
import {Router} from "@angular/router";
import {UserDto} from "../../models/auth/user-dto";
import {BehaviorSubject, catchError, Observable, tap, throwError} from "rxjs";
import {ApiResult} from "../../models/common/api-result";
import {ChatService} from "../chat/chat.service";
import {UserProfileService} from "../user-profile/user-profile.service";
import {UserProfile} from "../../models/user-profile/user-profile";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
    private _user$: BehaviorSubject<UserDto | undefined> = new BehaviorSubject<UserDto | undefined>(undefined);
    private _isSignedIn$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    public user$: Observable<UserDto | undefined> = this._user$.asObservable();
    public isSignedIn$: Observable<boolean> = this._isSignedIn$.asObservable();

    public get user(): UserDto | undefined { return this._user$.value; };
    public get isSignedIn(): boolean { return this._isSignedIn$.value; };

    constructor(private httpClient: HttpClient, private router: Router, private chatService: ChatService, private userProfileService: UserProfileService) {
        this._user$.subscribe(x => {
           if (x) {
               this._isSignedIn$.next(true);

               this.userProfileService.get(x.id, { full: true })
                   .subscribe(x => {
                       this.userProfileService.userProfile$.next(UserProfile.fromDto(x));
                   });

               this.chatService.startConnection().subscribe();
           } else {
               this._isSignedIn$.next(false);

               this.chatService.stopConnection().subscribe();
           }
        });
    }

    signIn(signInDto: SignInRequestDto) {
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
            this._user$.next(undefined);
        })
      );
    }

    signUp(signUpDto: SignUpRequestDto) {
    return this.httpClient.post<ApiResult>("/api/auth/signup", signUpDto, { withCredentials: true, })
      .pipe(
        tap((apiResult) => {
        })
      );
    }

    loadUser() {
    return this.httpClient.get<UserDto>("/api/user", { withCredentials: true, })
      .pipe(
        tap(value => {
          this._user$.next(value);
        }),
      );
    }
}
