import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {UserDto} from "../../models/auth/user-dto";
import {
  BehaviorSubject,
  catchError, EMPTY, iif,
  lastValueFrom,
  map, merge,
  Observable,
  of, race,
  ReplaySubject,
  shareReplay, Subject, switchMap,
  tap,
  throwError
} from "rxjs";
import {UserProfileDto, UserProfileFullDto, UserProfileRequestDto} from "../../models/user-profile/user-profile-dto";
import {CreateUserProfileRequestDto} from "../../models/user-profile/create-user-profile-dto";
import {ApiResult, ApiResultWithData} from "../../models/common/api-result";
import {UpdateUserProfileAvatarRequestDto} from "../../models/user-profile/update-user-profile-avatar-dto";
import {PostPhotoRequestDto} from "../../models/user-profile/post-photo-dto";
import {GetPhotoRequestDto} from "../../models/user-profile/get-photo-dto";
import {UserProfile} from "../../models/user-profile/user-profile";
import {SearchUserProfilesDto} from "../../models/user-profile/search-user-profiles-dto";

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  public readonly userProfile$: BehaviorSubject<UserProfile | undefined> = new BehaviorSubject<UserProfile | undefined>(undefined);

  private _cachedUserProfiles = new Map<string, { userProfile$: Observable<UserProfile>, manualUpdate$: BehaviorSubject<UserProfile | undefined>, }>();


  public get userProfile(): UserProfile | undefined {
    return this.userProfile$.value;
  }

  constructor(private httpClient: HttpClient) {

  }

  get(idOrUsername: string, dto: UserProfileRequestDto) : Observable<UserProfile> {
    return this.httpClient.get<ApiResultWithData<UserProfileDto>>(`api/user/${idOrUsername}/profile`, {
      withCredentials: true,
    }).pipe(
        map(x => UserProfile.fromDto(x.data, this)),
        tap(userProfile => {

        }),
    );
  }

  create(user: UserDto, createUserProfileDto: CreateUserProfileRequestDto) {
    return this.httpClient.post<ApiResult>(`api/user/profile`, createUserProfileDto, {
      withCredentials: true,
    });
  }

  search(dto: SearchUserProfilesDto) {
    return this.httpClient.get<ApiResultWithData<UserProfileDto[]>>('api/users/profiles/search', { withCredentials: true, params: new HttpParams({ fromObject: dto as any, }), })
      .pipe(
        map(value => value.data.map(x => UserProfile.fromDto(x, this))),
      );
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

  find(userId: string) {
    return this.getOrCreate(userId).userProfile$;
  }

  getOrCreate(userId: string) {
    let cachedData = this._cachedUserProfiles.get(userId);

    if (cachedData) {
      return cachedData;
    }

    const userProfileApi$ = this.get(userId, { full: false, })
      .pipe(
        catchError((err, caught) => {
          if (err.error.statusCode === 404) {
            return EMPTY;
          }

          throw err;
        }),
      );

    const manualUpdate$ = new BehaviorSubject<UserProfile | undefined>(undefined);

    const userProfile$ = manualUpdate$
      .pipe(
        switchMap(value => iif(() => !!value, of(value!), userProfileApi$)),

        shareReplay(1),
      );

    cachedData = { userProfile$: userProfile$, manualUpdate$: manualUpdate$, };

    this._cachedUserProfiles.set(userId, cachedData);

    return cachedData;
  }

  update(userId: string, userProfile: UserProfile) {
    let cachedData = this.getOrCreate(userId);

    cachedData.manualUpdate$.next(userProfile);
  }
}
