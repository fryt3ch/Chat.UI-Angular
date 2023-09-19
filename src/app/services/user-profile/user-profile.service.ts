import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {User} from "../../models/auth/user";
import {catchError, map, Observable, of} from "rxjs";
import {UserProfileDto} from "../../models/user-profile/user-profile-dto";
import {CreateUserProfileDto} from "../../models/user-profile/create-user-profile-dto";
import {ApiResult, ApiResultWithData} from "../../models/common/api-result";
import {UpdateUserProfileAvatarDto} from "../../models/user-profile/update-user-profile-avatar-dto";
import {PostPhotoDto} from "../../models/user-profile/post-photo-dto";
import {GetPhotoDto} from "../../models/user-profile/get-photo-dto";
import {GetPhotoResultDto} from "../../models/user-profile/get-photo-result-dto";

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {

  constructor(private httpClient: HttpClient) {

  }

  get(username: string) : Observable<UserProfileDto> {
    return this.httpClient.get<UserProfileDto>(`api/user/${username}/profile`, {
      withCredentials: true,
    });
  }

  create(user: User, createUserProfileDto: CreateUserProfileDto) {
    return this.httpClient.post<ApiResult>(`api/user/${user.id}/profile`, createUserProfileDto, {
      withCredentials: true,
    });
  }

  postPhoto(photoFile: File, postPhotoDto: PostPhotoDto) {
    const formData = new FormData();

    formData.append("file", photoFile, photoFile.name);
    formData.append("postPhotoDto", JSON.stringify(postPhotoDto));

    return this.httpClient.post<ApiResultWithData<string>>(`/api/user/profile/photo`, formData, {
      withCredentials: true,
    })
  }

  updateAvatar(updateAvatarDto: UpdateUserProfileAvatarDto) {
    return this.httpClient.put<ApiResult>(`/api/user/profile/photo/avatar`, updateAvatarDto, {
      withCredentials: true,
    })
  }

  getPhoto(getPhotoDto: GetPhotoDto) {
    return this.httpClient.get<ApiResultWithData<GetPhotoResultDto>>(`/api/user/${getPhotoDto.userId}/profile/photo/${getPhotoDto.photoId}`, {
      withCredentials: true,
    })
      .pipe(
        map(value => {
          return value.data;
        }),
      )
  }
}
