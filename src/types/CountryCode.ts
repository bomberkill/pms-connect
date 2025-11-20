export interface CountryCode {
  /** Nom complet du pays (ex: "United Arab Emirates") */
  name: string;

  /** Code ISO du pays sur 2 lettres (ex: "AE") */
  code: string;

  /** Emoji du drapeau (ex: "🇦🇪") */
  emoji: string;

  /** Représentation Unicode du drapeau (ex: "U+1F1E6 U+1F1EA") */
  unicode: string;

  /** Nom du fichier image du drapeau (ex: "AE.svg") */
  image: string;

  /** Indicatif téléphonique (ex: "+971") */
  dial_code: string;
}