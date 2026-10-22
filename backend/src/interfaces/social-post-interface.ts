import { SocialNetwork } from "../models/social-post-model.js";

export interface SocialPostInterface{
  id: string,
  network: SocialNetwork,
  url: string,
  external_id: string | null,
  caption: string,
  image_url: string | null,
  video_id: string | null,
  published_at: Date,
  visible: boolean,
  created_by: string | null,
  created_at: Date,
  updated_at: Date
}
