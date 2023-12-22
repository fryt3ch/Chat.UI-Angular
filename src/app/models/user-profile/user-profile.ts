import {BehaviorSubject, Observable, shareReplay} from "rxjs";
import {UserProfileService} from "../../services/user-profile/user-profile.service";
import {UserProfileDto} from "./user-profile-dto";
import {UserProfileColor} from "../common/user-profile-color.enum";
import {Gender} from "../common/gender.enum";
import {Country} from "../common/country.enum";

export class UserProfile {
    id: string;
    username: string;
    name: string;
    surname: string;
    avatarPhotoId: string | undefined;
    color: UserProfileColor;

    gender: Gender;
    country: Country;
    birthDate: Date;

    displayName: string;

    avatarPhotoUrl$: Observable<string> | undefined;

    public readonly isOnline$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    public get isOnline() { return this.isOnline$.value; };

    constructor(
      id: string,
      username: string,
      name: string,
      surname: string,
      avatarPhotoId: string | undefined,
      color: UserProfileColor,
      gender: Gender,
      country: Country,
      birthDate: Date,
      userProfileService: UserProfileService
    ) {
        this.id = id;
        this.username = username;
        this.name = name;
        this.surname = surname;
        this.avatarPhotoId = avatarPhotoId;
        this.color = color;

        this.gender = gender;
        this.country = country;
        this.birthDate = birthDate;

        if (this.surname) {
          this.displayName = this.name + ' ' + this.surname;
        } else {
          this.displayName = this.name;
        }

        if (this.avatarPhotoId) {
          this.avatarPhotoUrl$ = userProfileService.getPhoto({ userId: this.id, photoId: this.avatarPhotoId, })
            .pipe(shareReplay(1));
        }
    }

    public static fromDto(dto: UserProfileDto, userProfileService: UserProfileService) {
        return new UserProfile(dto.id, dto.username, dto.name, dto.surname, dto.avatarPhotoId, dto.color, dto.gender, dto.country, new Date(dto.birthDate), userProfileService);
    }
}
