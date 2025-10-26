import { MediaItem, Post } from './Post';
import { User } from './User';

export enum CommentStatus {
  VISIBLE = 'VISIBLE',
  DELETED = 'DELETED',
}

/**
 * Represents a Comment object, mirroring the GraphQL schema.
 */
export interface Comment {
  id: string;
  content: string;
  author: User;
  post: Partial<Post>;
  parent?: Partial<Comment>;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  commentsCount: number;
  media?: MediaItem[];
  isLiked?: boolean;
  status: CommentStatus;
}

export type CreateCommentInput = {
    postId: string;
    content: string;
    media?: MediaItem[];
    parentId?: string;
};