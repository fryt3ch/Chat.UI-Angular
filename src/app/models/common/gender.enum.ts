export enum Gender {
  male = 0,
  female = 1,
}

export function getGenderNameLocale(gender: Gender) : string {
  return `genders.${Gender[gender]}.name`;
}
