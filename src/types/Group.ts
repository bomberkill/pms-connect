import { User } from './User';

export enum GroupPrivacy {
    PUBLIC = 'PUBLIC',
    PRIVATE = 'PRIVATE',
}

export enum GroupMemberRole {
    ADMIN = 'ADMIN',
    MEMBER = 'MEMBER',
}

export interface GroupMember {
    user: User;
    role: GroupMemberRole;
    joinedAt: string;
}

export interface Group {
    _id: string;
    id: string;
    name: string;
    slug: string;
    description?: string;
    privacy: GroupPrivacy;
    profileImageUrl?: string;
    coverImageUrl?: string;
    creator: User;
    members: GroupMember[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateGroupInput {
    name: string;
    description?: string;
    privacy: GroupPrivacy;
}
