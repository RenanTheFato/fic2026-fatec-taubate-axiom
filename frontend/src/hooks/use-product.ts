import { useQuery } from "@tanstack/react-query"
import { getProductBySku } from "../services/product/get-product-by-sku-service"

export function useProduct(sku: string) {
  return useQuery({
    queryKey: ["products", "detail", sku],
    queryFn: () => getProductBySku(sku),
    enabled: sku.length > 0,
    retry: false,
  })
}
