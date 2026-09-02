export type Partner = {
  id: string
  name: string
  /** Caminho do logo em `public/parceiros/`. `null` enquanto o arquivo não existe. */
  logo: string | null
  site: string | null
}
