import { User } from "./User";

/**
 * This enum must match the `ConnectionRequestStatus` enum on the backend.
 */
export enum ConnectionRequestStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    DECLINED = 'DECLINED',
    CANCELLED = 'CANCELLED',
    TERMINATED = 'TERMINATED',
}

export interface ConnectionRequest {
    id: string;
    requester: User; // Using Partial<User> as we might not fetch all user fields
    recipient: User;
    status: ConnectionRequestStatus;
    createdAt: string; // Dates are typically strings over GraphQL/JSON
    updatedAt: string;
}

export interface ConnectionRequestForSubscription {
    id: string;
    requester: string; // Using Partial<User> as we might not fetch all user fields
    recipient: string;
    status: ConnectionRequestStatus;
    createdAt: string; // Dates are typically strings over GraphQL/JSON
    updatedAt: string;
}