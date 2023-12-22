import {Country} from "../common/country.enum";
import {Gender} from "../common/gender.enum";
import {UserProfileColor} from "../common/user-profile-color.enum";

export interface UserProfileDto {
  id: string;
  username: string;
  name: string;
  surname: string;
  gender: Gender;
  country: Country;
  birthDate: string;
  avatarPhotoId: string | undefined;
  color: UserProfileColor;
}

export interface UserProfileFullDto extends UserProfileDto {

}

export interface UserProfileRequestDto {
  full: boolean;
}
