// Único lugar que sabe onde o token mora. O interceptor do Axios, o provider de
// sessão e a tela de login leem daqui. Se a decisão mudar (cookie, memória),
// muda um arquivo.
//
// `localStorage` pode lançar: navegação privada em alguns navegadores, e
// políticas que bloqueiam armazenamento de site. Falhar ao guardar o token é
// ruim, mas derrubar a aplicação inteira por causa disso é pior.
const KEY = "somosdobem.token"

export function readToken(): string | null {
  try {
    return window.localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function writeToken(token: string): void {
  try {
    window.localStorage.setItem(KEY, token)
  } catch {
    // Sem armazenamento a sessão vale só enquanto a aba estiver aberta, e é o
    // interceptor que segue usando o token em memória.
  }
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // Nada a fazer: se não dá para escrever, também não havia o que apagar.
  }
}
