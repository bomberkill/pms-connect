import { User } from './User';


export enum PostStatus {
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
}

/**
 * Represents a Media Item attached to a Post.
 */
export interface MediaItem {
  url: string;
  type: MediaType;
}

/**
 * Represents a Post object, mirroring the GraphQL schema.
 */
export interface Post {
  id: string;
  content: string;
  media?: MediaItem[];
  author: User;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  sharesCount: number;
  createdAt: string; // Dates are typically strings when serialized over JSON.
  updatedAt: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
  status: PostStatus;
}


export interface CreatePostInput {
  content: string;
  media?: MediaItem[];
  status?: PostStatus;
  groupId?: string;
}

export interface UpdatePostInput {
  content?: string;
  status?: PostStatus;
}