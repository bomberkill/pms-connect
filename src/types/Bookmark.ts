import { Comment } from "./Comment";
import { Post } from "./Post";

export interface Bookmark {
    id: string; // MongoDB ObjectId
    item: Post | Comment;
    createdAt: string; // GraphQLISODateTime
}

export enum BookmarkableTypeGQL {
  POST = 'POST',
  COMMENT = 'COMMENT',
}