import {Country} from "../common/country.enum";
import {Gender} from "../common/gender.enum";

export interface CreateUserProfileRequestDto {
  name: string;
  surname: string;
  gender: Gender;
  birthDate: Date;
  country: Country;
}
