import { api } from "../../config/api"
import type { SocialNetwork, SocialPage } from "../../types/social-types"

export const SOCIAL_PER_PAGE = 12

// O que a associação publicou nas redes, para a página de redes sociais e para
// a faixa da home. Só as publicações visíveis, da mais nova para a mais antiga.
export async function listSocialPosts({ network, page, limit = SOCIAL_PER_PAGE }: { network: SocialNetwork | null; page: number; limit?: number }): Promise<SocialPage> {
  const { data } = await api.get<SocialPage>("/social/list", {
    params: { page, limit, ...(network ? { network } : {}) },
  })

  return { posts: data.posts, total: data.total, networks: data.networks }
}
