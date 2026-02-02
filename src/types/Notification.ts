import { User } from "./User";

export enum NotificationType {
    POST_LIKE = 'POST_LIKE',
    POST_COMMENT = 'POST_COMMENT',
    NEW_FOLLOWER = 'NEW_FOLLOWER',
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
