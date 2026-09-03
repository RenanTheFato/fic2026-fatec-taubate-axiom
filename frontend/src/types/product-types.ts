// Espelha ProductInterface do backend. `price` é DECIMAL, ou seja, string, nunca
// number: formatar é trabalho do `formatCurrency`, e somar é trabalho do SQL.
export type Product = {
  id: string
  name: string
  sku: string | null
  description: string | null
  price: string
  stock: number
  image_url: string | null
  active: boolean
  activated_at: string | null
  created_at: string
  updated_at: string
}
