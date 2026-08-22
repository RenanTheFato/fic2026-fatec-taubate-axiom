// Slug de campanha e de evento saem da mesma regra: acento fora, tudo minúsculo, o que não for
// letra ou número vira hífen. Duplicar isso em cada service deixaria os dois domínios livres para
// divergir com o tempo, e a URL pública é o que menos pode mudar de forma sem aviso.
export function slugify(title: string) {
  return title.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
