import {Country} from "../common/country.enum";
import {Gender} from "../common/gender.enum";

export interface UserProfileDto {
  id: string;
  username: string;
  name: string;
  surname: string;
  gender: Gender;
  country: Country;
  birthDate: Date;
  avatarPhotoId: string | null;
}
