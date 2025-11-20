/**
 * GraphQL Enums from API related to Users
 */

export enum UserTypeGQL {
    INDIVIDUAL = 'INDIVIDUAL',
    LEGAL_ENTITY = 'LEGAL_ENTITY',
  }
  
  export enum AccountStatusGQL {
    ACTIVE = 'ACTIVE',
    PENDING_VERIFICATION = 'PENDING_VERIFICATION',
    SUSPENDED = 'SUSPENDED',
    DEACTIVATED = 'DEACTIVATED',
  }
  
  export enum SpecialityGQL {
    MEDICAL_DOCTORS = 'MEDICAL_DOCTORS',
    DENTAL_SURGEONS = 'DENTAL_SURGEONS',
    PHARMACISTS = 'PHARMACISTS',
    NURSES = 'NURSES',
    SANITARY_ENGINEERING = 'SANITARY_ENGINEERING',
    MEDICO_SANITARY_TECHNICIANS = 'MEDICO_SANITARY_TECHNICIANS',
    PUBLIC_HEALTH_ADMINISTRATION = 'PUBLIC_HEALTH_ADMINISTRATION',
    MIDWIVES = 'MIDWIVES',
    MEDICAL_REPRESENTATIVES = 'MEDICAL_REPRESENTATIVES',
    CAREGIVERS = 'CAREGIVERS',
    PHARMACY_ASSISTANTS = 'PHARMACY_ASSISTANTS',
    OTHER_HEALTH_AUXILIARY = 'OTHER_HEALTH_AUXILIARY',
    // Add other specialities as needed from your API
  }
  
  export enum EntityTypeGQL {
    HOSPITAL = 'HOSPITAL',
    CLINIC = 'CLINIC',
    LABORATORY = 'LABORATORY',
    PHARMACEUTICAL_COMPANY = 'PHARMACEUTICAL_COMPANY',
    MEDICAL_ASSOCIATION = 'MEDICAL_ASSOCIATION',
    HEALTH_TRAINING_INSTITUTION = 'HEALTH_TRAINING_INSTITUTION',
    COMPANY = 'COMPANY',
    IMAGING_CENTER = 'IMAGING_CENTER',
    ASSOCIATION = 'ASSOCIATION',

    // Add other entity types as needed from your API
  }
  
  /**
   * Nested Object Types for Users
   */
  
  export interface ProfessionalAccreditation {
    accreditationType?: string;
    referenceNumber?: string;
    documentUrl: string;
    issueDate?: string; // GraphQLISODateTime typically comes as string
    expirationDate?: string; // GraphQLISODateTime typically comes as string
    issuingAuthority?: string;
  }
  
  export interface Location {
    country: string;
    stateOrProvince?: string;
    city?: string;
    addressLine1?: string;
    addressLine2?: string;
    postalCode?: string;
  }
  
  /**
   * Base User Interface (corresponds to the User InterfaceType in GraphQL)
   * We'll use a discriminated union for IndividualUser and LegalEntityUser
   */
  interface BaseUser {
    id: string; // MongoDB ObjectId
    firebaseUid: string;
    email: string;
    phoneNumber: string;
    slug: string;
    userType: UserTypeGQL;
    professionalAccreditation: ProfessionalAccreditation[];
    profilePicUrl?: string;
    coverPicUrl?: string;
    bio?: string;
    location?: Location;
    websiteUrl?: string;
    accountStatus: AccountStatusGQL;
    connections: string[]; // Array of user IDs
    followers: string[];   // Array of user IDs
    following: string[];   // Array of user IDs
    blockedUsers: string[];// Array of user IDs
    fcmTokens: string[];   // Array of FCM tokens
    language: string;      // ISO 639-1 code
    createdAt: string;     // GraphQLISODateTime
    updatedAt: string;     // GraphQLISODateTime
    lastLoginAt?: string;  // GraphQLISODateTime
  }
  
  export interface IndividualUser extends BaseUser {
    userType: UserTypeGQL.INDIVIDUAL;
    firstName: string;
    lastName: string;
    speciality: SpecialityGQL;
    professionalTitle?: string;
  }
  
  export interface LegalEntityUser extends BaseUser {
    userType: UserTypeGQL.LEGAL_ENTITY;
    entityName: string;
    entityType: EntityTypeGQL;
  }
  
  export type User = IndividualUser | LegalEntityUser;
  
  /**
   * Input types (DTOs) for Users - useful for forms
   */
  
  // Example for CreateUserInput, you can expand this for others
  export interface CreateUserInput {
    email: string;
    userType: UserTypeGQL;
    phoneNumber: string;
    profilePicUrl?: string;
    coverPicUrl?: string;
    bio?: string;
    location?: Location;
    websiteUrl?: string;
    professionalAccreditation: ProfessionalAccreditation[];

    // Fields specific to IndividualUser (only include if userType is INDIVIDUAL)
    firstName?: string;
    lastName?: string;
    speciality?: SpecialityGQL;
    professionalTitle?: string;

    // Fields specific to LegalEntityUser (only include if userType is LEGAL_ENTITY)
    entityName?: string;
    entityType?: EntityTypeGQL;
  }

  export type UpdateUserInput = Partial<Omit<CreateUserInput, "email" | "userType">>;
  
  export interface UpdateAccountStatusInput {
      userId: string;
      accountStatus: AccountStatusGQL;
  }
    
  export interface GetAllUsersArgsType {
      skip?: number;
      limit?: number;
      userType?: UserTypeGQL;
      // Add other filter/sort arguments if your API supports them
  };
  
  // You can define other DTO types similarly (UpdateUserInput, etc.)

/**
 * Types related to Follow/Unfollow subscriptions
 */

export interface FollowerInfo {
  userId: string;
  followersCount: number;
}

export interface FollowingInfo {
  userId: string;
  followingCount: number;
}

export interface FollowsUpdated {
  follower: FollowerInfo;
  following: FollowingInfo;
}

export interface CheckUserExistsResponse {
  exists: boolean;
  hasPassword: boolean;
  providers: string[];
}