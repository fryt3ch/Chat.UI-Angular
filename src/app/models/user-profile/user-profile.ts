import {BehaviorSubject, Observable} from "rxjs";
import {UserProfileService} from "../../services/user-profile/user-profile.service";
import {UserProfileDto} from "./user-profile-dto";
import {UserProfileColor} from "../common/user-profile-color.enum";

export class UserProfile {
    id: string;
    username: string;
    name: string;
    surname: string;
    avatarPhotoId: string | undefined;
    color: UserProfileColor;

    avatarPhotoUrl$: Observable<string> | undefined;

    public readonly isOnline$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    public get isOnline() { return this.isOnline$.value; };

    constructor(id: string, username: string, name: string, surname: string, avatarPhotoId: string | undefined, color: UserProfileColor) {
        this.id = id;
        this.username = username;
        this.name = name;
        this.surname = surname;
        this.avatarPhotoId = avatarPhotoId;
        this.color = color;
    }

    public static fromDto(dto: UserProfileDto) {
        return new UserProfile(dto.id, dto.username, dto.name, dto.surname, dto.avatarPhotoId, dto.color);
    }
}
