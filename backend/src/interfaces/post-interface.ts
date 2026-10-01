import { PostCategory, PostStatus } from "../models/post-model.js";

export interface PostInterface{
  id: string,
  title: string,
  slug: string,
  excerpt: string,
  body: string,
  category: PostCategory,
  image_url: string | null,
  status: PostStatus,
  published_at: Date | null,
  author_id: string | null,
  created_at: Date,
  updated_at: Date
}
