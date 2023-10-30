import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {UserDto} from "../../models/auth/user-dto";
import {BehaviorSubject, catchError, map, Observable, of, ReplaySubject} from "rxjs";
import {UserProfileDto, UserProfileFullDto, UserProfileRequestDto} from "../../models/user-profile/user-profile-dto";
import {CreateUserProfileRequestDto} from "../../models/user-profile/create-user-profile-dto";
import {ApiResult, ApiResultWithData} from "../../models/common/api-result";
import {UpdateUserProfileAvatarRequestDto} from "../../models/user-profile/update-user-profile-avatar-dto";
import {PostPhotoRequestDto} from "../../models/user-profile/post-photo-dto";
import {GetPhotoRequestDto} from "../../models/user-profile/get-photo-dto";
import {UserProfile} from "../../models/user-profile/user-profile";

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  public readonly userProfile$: ReplaySubject<UserProfile> = new ReplaySubject<UserProfile>(1);

  constructor(private httpClient: HttpClient) {

  }

  get(idOrUsername: string, dto: UserProfileRequestDto) : Observable<UserProfileDto> {
    return this.httpClient.get<ApiResultWithData<UserProfileDto>>(`api/user/${idOrUsername}/profile`, {
      withCredentials: true,
    }).pipe(
        map(x => x.data),
    );
  }

  create(user: UserDto, createUserProfileDto: CreateUserProfileRequestDto) {
    return this.httpClient.post<ApiResult>(`api/user/profile`, createUserProfileDto, {
      withCredentials: true,
    });
  }

  postPhoto(photoFile: File, postPhotoDto: PostPhotoRequestDto) {
    const formData = new FormData();

    formData.append("file", photoFile, photoFile.name);
    formData.append("postPhotoDto", JSON.stringify(postPhotoDto));

    return this.httpClient.post<ApiResultWithData<string>>(`/api/user/profile/photo`, formData, {
      withCredentials: true,
    })
  }

  updateAvatar(updateAvatarDto: UpdateUserProfileAvatarRequestDto) {
    return this.httpClient.put<ApiResult>(`/api/user/profile/photo/avatar`, updateAvatarDto, {
      withCredentials: true,
    })
  }

  getPhoto(getPhotoDto: GetPhotoRequestDto) {
    return this.httpClient.get(`/api/user/${getPhotoDto.userId}/profile/photo/${getPhotoDto.photoId}`, {
      withCredentials: true,
      responseType: "blob",
    }).pipe(
        map(x => {
          return URL.createObjectURL(x)
        })
    );
  }
}
