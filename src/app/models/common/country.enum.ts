export enum Country {
  russia = 0,
  germany = 1,
  unitedStates = 2,
  unitedKingdom = 3,
}

const flags: Record<Country, string> = {
  [Country.russia]: '🇷🇺',
  [Country.germany]: '🇩🇪',
  [Country.unitedStates]: '🇺🇸',
  [Country.unitedKingdom]: '🇬🇧',
};

export function getCountryNameLocale(country: Country) : string {
  return `countries.${Country[country]}.name`;
}

export function getCountryFlagEmoji(country: Country) : string {
  return flags[country];
}
