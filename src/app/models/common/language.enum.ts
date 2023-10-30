export enum Language {
  russian = 0,
  english = 1,
}

export interface LanguageProperties {
  flag: string;
  name: string;
  code: string;
}

const properties: Record<Language, LanguageProperties> = {
  [Language.russian]: {
    flag: '🇷🇺',
    name: "Русский",
    code: "ru",
  },
  [Language.english]: {
    flag: '🇬🇧',
    name: "English",
    code: "en",
  },
};

export function getLanguageProperties(language: Language) : LanguageProperties {
  return properties[language];
}

export function getLanguageByCode(code: string) : Language | undefined {
  return (Object.keys(properties) as any as Array<Language>).find((key) => properties[key].code == code) as (Language | undefined);
}
