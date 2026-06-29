import { User } from './User';

export enum GroupPrivacy {
    PUBLIC = 'PUBLIC',
    PRIVATE = 'PRIVATE',
    SECRET = 'SECRET',
}

export enum GroupMemberRole {
    ADMIN = 'ADMIN',
    MODERATOR = 'MODERATOR',
    MEMBER = 'MEMBER',
}

export enum GroupJoinRequestStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED',
    INVITED = 'INVITED',
}

export interface GroupMember {
    _id?: string;
    user: User;
    role: GroupMemberRole;
    joinedAt: string;
}

export interface GroupMembership extends GroupMember {
    group?: Group;
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

export interface GroupJoinRequest {
    id: string;
    group: Group;
    user: User;
    status: GroupJoinRequestStatus;
    createdAt: string;
    updatedAt: string;
}
