import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {IUser} from "../../models/auth/user";
import {Observable} from "rxjs";
import {IUserProfileDto} from "../../models/userProfileDto";

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {

  constructor(private httpClient: HttpClient) {

  }

  get(username: string) : Observable<IUserProfileDto> {
    return this.httpClient.get<IUserProfileDto>("api/user/profile", {
      params: { "username": username, },
      withCredentials: true,
    });
  }
}
