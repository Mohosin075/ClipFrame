import { Model, Types } from 'mongoose'

export interface IUseronboardingFilterables {
  searchTerm?: string
  businessType?: string
  customBusinessType?: string
  businessDescription?: string
}

export enum SocialPlatform {
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  TIKTOK = 'tiktok',
  TWITTER = 'twitter',
  LIKEE = 'likee',
}

export enum ContentLanguage {
  AA = 'aa', // Afar
  AB = 'ab', // Abkhazian
  AE = 'ae', // Avestan
  AF = 'af', // Afrikaans
  AK = 'ak', // Akan
  AM = 'am', // Amharic
  AN = 'an', // Aragonese
  AR = 'ar', // Arabic
  AS = 'as', // Assamese
  AV = 'av', // Avaric
  AY = 'ay', // Aymara
  AZ = 'az', // Azerbaijani
  BA = 'ba', // Bashkir
  BE = 'be', // Belarusian
  BG = 'bg', // Bulgarian
  BH = 'bh', // Bihari
  BI = 'bi', // Bislama
  BM = 'bm', // Bambara
  BN = 'bn', // Bengali
  BO = 'bo', // Tibetan
  BR = 'br', // Breton
  BS = 'bs', // Bosnian
  CA = 'ca', // Catalan
  CE = 'ce', // Chechen
  CH = 'ch', // Chamorro
  CO = 'co', // Corsican
  CR = 'cr', // Cree
  CS = 'cs', // Czech
  CU = 'cu', // Church Slavic
  CV = 'cv', // Chuvash
  CY = 'cy', // Welsh
  DA = 'da', // Danish
  DE = 'de', // German
  DZ = 'dz', // Dzongkha
  EE = 'ee', // Ewe
  EL = 'el', // Greek
  EN = 'en', // English
  EO = 'eo', // Esperanto
  ET = 'et', // Estonian
  EU = 'eu', // Basque
  FA = 'fa', // Persian
  FF = 'ff', // Fula
  FI = 'fi', // Finnish
  FJ = 'fj', // Fijian
  FO = 'fo', // Faroese
  FR = 'fr', // French
  GA = 'ga', // Irish
  GL = 'gl', // Galician
  GN = 'gn', // Guarani
  GU = 'gu', // Gujarati
  GV = 'gv', // Manx
  HA = 'ha', // Hausa
  HE = 'he', // Hebrew
  HI = 'hi', // Hindi
  HO = 'ho', // Hiri Motu
  HR = 'hr', // Croatian
  HT = 'ht', // Haitian Creole
  HU = 'hu', // Hungarian
  HY = 'hy', // Armenian
  HZ = 'hz', // Herero
  IA = 'ia', // Interlingua
  ID = 'id', // Indonesian
  IE = 'ie', // Interlingue
  IG = 'ig', // Igbo
  II = 'ii', // Yi
  IK = 'ik', // Inupiaq
  IN = 'in', // Indonesian
  IO = 'io', // Ido
  IS = 'is', // Icelandic
  IT = 'it', // Italian
  IU = 'iu', // Inuktitut
  JA = 'ja', // Japanese
  JV = 'jv', // Javanese
  KA = 'ka', // Georgian
  KK = 'kk', // Kazakh
  KL = 'kl', // Greenlandic
  KM = 'km', // Khmer
  KN = 'kn', // Kannada
  KO = 'ko', // Korean
  KR = 'kr', // Kanuri
  KU = 'ku', // Kurdish
  KY = 'ky', // Kyrgyz
  LA = 'la', // Latin
  LB = 'lb', // Luxembourgish
  LO = 'lo', // Lao
  LT = 'lt', // Lithuanian
  LU = 'lu', // Luba-Katanga
  LV = 'lv', // Latvian
  MG = 'mg', // Malagasy
  MH = 'mh', // Marshallese
  MI = 'mi', // Māori
  MK = 'mk', // Macedonian
  ML = 'ml', // Malayalam
  MN = 'mn', // Mongolian
  MR = 'mr', // Marathi
  MS = 'ms', // Malay
  MT = 'mt', // Maltese
  MY = 'my', // Burmese
  NA = 'na', // Nauru
  NB = 'nb', // Norwegian Bokmål
  ND = 'nd', // North Ndebele
  NE = 'ne', // Nepali
  NG = 'ng', // Ndonga
  NL = 'nl', // Dutch
  NN = 'nn', // Norwegian Nynorsk
  NO = 'no', // Norwegian
  NR = 'nr', // South Ndebele
  OC = 'oc', // Occitan
  OJ = 'oj', // Ojibwa
  OR = 'or', // Oriya
  OS = 'os', // Ossetian
  PA = 'pa', // Punjabi
  PI = 'pi', // Pali
  PL = 'pl', // Polish
  PS = 'ps', // Pashto
  PT = 'pt', // Portuguese
  QU = 'qu', // Quechua
  RM = 'rm', // Romansh
  RN = 'rn', // Kirundi
  RO = 'ro', // Romanian
  RU = 'ru', // Russian
  RW = 'rw', // Kinyarwanda
  SA = 'sa', // Sanskrit
  SC = 'sc', // Sardinian
  SD = 'sd', // Sindhi
  SE = 'se', // Northern Sami
  SG = 'sg', // Sango
  SI = 'si', // Sinhala
  SK = 'sk', // Slovak
  SL = 'sl', // Slovenian
  SM = 'sm', // Samoan
  SN = 'sn', // Shona
  SO = 'so', // Somali
  SQ = 'sq', // Albanian
  SR = 'sr', // Serbian
  SS = 'ss', // Swati
  ST = 'st', // Southern Sotho
  SU = 'su', // Sundanese
  SV = 'sv', // Swedish
  SW = 'sw', // Swahili
  SY = 'sy', // Syriac
  TA = 'ta', // Tamil
  TE = 'te', // Telugu
  TG = 'tg', // Tajik
  TH = 'th', // Thai
  TI = 'ti', // Tigrinya
  TK = 'tk', // Turkmen
  TL = 'tl', // Tagalog
  TN = 'tn', // Tswana
  TO = 'to', // Tonga
  TR = 'tr', // Turkish
  TS = 'ts', // Tswana
  TT = 'tt', // Tatar
  TW = 'tw', // Twi
  TY = 'ty', // Tahitian
  UG = 'ug', // Uighur
  UK = 'uk', // Ukrainian
  UR = 'ur', // Urdu
  VI = 'vi', // Vietnamese
  VO = 'vo', // Volapük
  WA = 'wa', // Walloon
  WO = 'wo', // Wolof
  XH = 'xh', // Xhosa
  YI = 'yi', // Yiddish
  ZH = 'zh', // Chinese
  ZU = 'zu', // Zulu
}

export interface SocialHandlesItem {
  platform: SocialPlatform
  username: string
}

export enum TargetAudience {
  LOCAL = 'local',
  TOURIST = 'tourist',
  ONLINE = 'online',
  ALL = 'all',
}

export interface IBrandColor {
  name: string
  value: string
}

export interface IUseronboarding {
  _id: Types.ObjectId
  userId: Types.ObjectId
  businessType: string
  // customBusinessType?: string
  businessDescription?: string
  targetAudience: TargetAudience[]
  preferredLanguages?: ContentLanguage
  autoTranslateCaptions: boolean
  socialHandles: SocialHandlesItem[]
  logo: string
  brandColors: IBrandColor[]
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

export type UseronboardingModel = Model<IUseronboarding, {}, {}>
