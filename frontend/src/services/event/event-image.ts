// A tabela `events` do backend não tem coluna de imagem, então o caminho é
// resolvido aqui pelo slug. O arquivo mora em `public/imagens/eventos/<slug>`,
// e a extensão está escrita porque ela varia: adivinhar `.jpg` dispararia um
// 404 por card em todo evento que foi salvo como `.png`.
//
// Sem arquivo, a função devolve `null` e o `<ImageSlot>` mostra o lugar
// reservado descrevendo a foto que falta, que é uma saída digna. Imagem
// quebrada não é.
const IMAGE_BY_SLUG: Record<string, string> = {
  "chefs-do-bem-6a-edicao": "/imagens/eventos/chefs-do-bem-6a-edicao.png",
  "chocolate-do-bem-2026": "/imagens/eventos/chocolate-do-bem-2026.png",
  "dia-de-portas-abertas": "/imagens/eventos/dia-de-portas-abertas.jpg",
}

export function resolveEventImage(slug: string): string | null {
  return IMAGE_BY_SLUG[slug] ?? null
}
