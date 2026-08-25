export interface TransactionItemInterface{
  id: string,
  transaction_id: string,
  product_id: string | null,
  description: string,
  quantity: number,
  unit_price: string,
  created_at: Date,
  updated_at: Date
}
