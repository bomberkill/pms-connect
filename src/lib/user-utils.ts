import { IndividualUser, LegalEntityUser, User, UserTypeGQL } from "@/types/User";

/**
 * Type guard pour vérifier si un utilisateur est un 'IndividualUser'.
 * @param user L'objet utilisateur à vérifier.
 * @returns `true` si l'utilisateur est un IndividualUser, sinon `false`.
 */
export function isIndividualUser(user: Partial<User>): user is IndividualUser {
  return user.userType === UserTypeGQL.INDIVIDUAL;
}

/**
 * Type guard pour vérifier si un utilisateur est un 'LegalEntityUser'.
 * @param user L'objet utilisateur à vérifier.
 * @returns `true` si l'utilisateur est un LegalEntityUser, sinon `false`.
 */
export function isLegalEntityUser(user: Partial<User>): user is LegalEntityUser {
    return user.userType === UserTypeGQL.LEGAL_ENTITY;
}

/**
 * Retourne le nom complet ou le nom de l'entité d'un utilisateur.
 * @param user L'objet utilisateur.
 * @returns Le nom complet formaté.
 */
export function getUserDisplayName(user: Partial<User>): string {
  if (isIndividualUser(user)) {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }
  if (isLegalEntityUser(user)) {
    return user.entityName || '';
  }
  return '';
}

export function getProfessionalTitle(user: Partial<User>): string {
  if (isIndividualUser(user)) {
    return user.professionalTitle || '';
  }
  if (isLegalEntityUser(user)) {
    return user.entityType || '';
  }
  return '';
}

/**
 * Retourne les initiales du nom d'un utilisateur.
 * @param user L'objet utilisateur.
 * @returns Les initiales.
 */
export function getUserInitials(user: Partial<User>): string {
  if (isIndividualUser(user)) {
    const firstNameInitial = user.firstName?.[0] || '';
    const lastNameInitial = user.lastName?.[0] || '';
    return `${firstNameInitial}${lastNameInitial}`;
  }
  if (isLegalEntityUser(user)) {
    return user.entityName?.[0] || '';
  }
  return '';
}