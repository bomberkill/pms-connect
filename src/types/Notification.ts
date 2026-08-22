import { User } from "./User";

export enum NotificationType {
    POST_LIKE = 'POST_LIKE',
    COMMENT_LIKE = 'COMMENT_LIKE',
    POST_COMMENT = 'POST_COMMENT',
    NEW_FOLLOWER = 'NEW_FOLLOWER',
    CONNECTION_REQUEST = 'CONNECTION_REQUEST',
    CONNECTION_ACCEPTED = 'CONNECTION_ACCEPTED',
    GROUP_INVITATION = 'GROUP_INVITATION',
    GROUP_JOIN_REQUEST = 'GROUP_JOIN_REQUEST',
    GROUP_JOIN_REQUEST_ACCEPTED = 'GROUP_JOIN_REQUEST_ACCEPTED',
    POST_APPROVED = 'POST_APPROVED',
    POST_REJECTED = 'POST_REJECTED',
}

export interface Notification {
    id: string;
    sender: User;
    type: NotificationType;
    read: boolean;
    createdAt: string;
    message: string;
    entityId?: string;
}

export interface NotificationPreference {
    notifyReplies: boolean;
    notifyMentions: boolean;
    notifyConnectionRequests: boolean;
    notifyReactions: boolean;
    notifyGroupActivity: boolean;
    notifyEstablishmentAnnouncements: boolean;
    quietHoursEnabled: boolean;
    quietHoursStart: number | null;
    quietHoursEnd: number | null;
    weeklyEmailDigest: boolean;
}

export type UpdateNotificationPreferencesInput = Partial<NotificationPreference>;
