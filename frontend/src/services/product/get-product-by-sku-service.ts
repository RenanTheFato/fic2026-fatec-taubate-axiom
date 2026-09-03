import { NotFoundError } from "../../config/errors"
import type { Product } from "../../types/product-types"
import { listProducts } from "./list-products-service"

// A rota de detalhe do backend é `GET /product/:id`, e o id é um UUID. Colocar
// um UUID em `/loja/:produto` daria uma URL que ninguém lê, ninguém digita e
// ninguém reconhece, o oposto do que a convenção de rota pede.
//
// O SKU já é um identificador estável e legível ("sdb-cam-br"), e a busca da
// listagem casa por SKU. Uma requisição resolve a tela inteira, porque a
// listagem devolve o produto completo. Quando a tabela ganhar `slug`, esta
// função troca de rota e nenhuma tela muda.
export async function getProductBySku(sku: string): Promise<Product> {
  const wanted = sku.trim().toLowerCase()

  const { products } = await listProducts(wanted)

  const product = products.find((candidate) => candidate.sku?.toLowerCase() === wanted)

  if (!product) {
    throw new NotFoundError("Produto não encontrado")
  }

  return product
}

export function productPath(product: Pick<Product, "id" | "sku">): string {
  return `/loja/${(product.sku ?? product.id).toLowerCase()}`
}
