import { useQuery } from "@tanstack/react-query"
import { listProducts } from "../services/product/list-products-service"

export function useProducts(search?: string) {
  return useQuery({
    queryKey: ["products", "list", search ?? null],
    queryFn: () => listProducts(search),
  })
}
