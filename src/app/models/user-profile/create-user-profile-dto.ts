import {Country} from "../common/country.enum";
import {Gender} from "../common/gender.enum";

export interface CreateUserProfileDto {
  name: string;
  surname: string;
  gender: Gender;
  birthDate: Date;
  country: Country;
}
