export interface ProductInterface{
  id: string,
  name: string,
  sku: string | null,
  description: string | null,
  price: string,
  stock: number,
  image_url: string | null,
  active: boolean,
  activated_at: Date | null,
  created_at: Date,
  updated_at: Date
}
