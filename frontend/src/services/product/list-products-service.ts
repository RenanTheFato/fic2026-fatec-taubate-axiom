import { api } from "../../config/api"
import type { Product } from "../../types/product-types"

type ListProductsResponse = {
  products: Product[]
  total: number
}

export type ProductList = {
  products: Product[]
  total: number
}

// `GET /product/list` é público e já devolve só o que está ativo, então produto
// desativado some do catálogo sem a tela precisar filtrar.
export async function listProducts(search?: string): Promise<ProductList> {
  const { data } = await api.get<ListProductsResponse>("/product/list", {
    params: { limit: 50, ...(search ? { search } : {}) },
  })

  return { products: data.products, total: data.total }
}
