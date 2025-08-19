// export interface Country {
//   id: number;            // integer($int64)
//   name: string;
//   iso3: string;
//   iso2: string;
//   phonecode: string;
//   capital: string;
//   currency: string;
//   native: string;
//   emoji: string;
//   states?: State[];
// }
export interface Timezone {
  zoneName: string;
  gmtOffset: number;
  gmtOffsetName: string;
  abbreviation: string;
  tzName: string;
}

export interface Translations {
  br?: string;
  ko?: string;
  "pt-BR"?: string;
  pt?: string;
  nl?: string;
  hr?: string;
  fa?: string;
  de?: string;
  es?: string;
  fr?: string;
  ja?: string;
  it?: string;
  "zh-CN"?: string;
  tr?: string;
  ru?: string;
  uk?: string;
  pl?: string;
}

export interface Country {
  id: number;
  name: string;
  iso3: string;
  iso2: string;
  numeric_code: string;
  phonecode: string;
  capital: string;
  currency: string;
  currency_name: string;
  currency_symbol: string;
  tld: string;
  native: string;
  region: string;
  region_id: number;
  subregion: string;
  subregion_id: number;
  nationality: string;
  timezones: Timezone[];
  translations: Translations;
  latitude: string;
  longitude: string;
  emoji: string;
  emojiU: string;
  states?: State[];
}
  // export interface State {
  //   id: number;            // integer($int64)
  //   name: string;
  //   iso2: string;
  //   cities?: City[];
  // }

  export interface State {
    id: number;
    name: string;
    // country_id: number;
    // country_code: string;
    // country_name: string;
    state_code: string;
    type: string;
    latitude: string;
    longitude: string;
    cities?: City[];
  }
  
  // export interface City {
  //   id: number;            // integer($int64)
  //   name: string;
  //   latitude: string;
  //   longitude: string;
  // }
  export interface City {
    id: number;
    name: string;
    // state_id: number;
    // state_code: string;
    // state_name: string;
    // country_id: number;
    // country_code: string;
    // country_name: string;
    latitude: string;
    longitude: string;
    // wikiDataId: string; 
  }