// Espelha o que `POST /photo/upload` devolve. O arquivo não volta: volta o
// endereço pronto, que é o que campanha, evento, produto e notícia gravam em
// `image_url`.
export type Photo = {
  id: string
  name: string
  mime_type: "image/png" | "image/jpeg"
  width: number
  height: number
  size: number
  url: string
  created_at: string
}
