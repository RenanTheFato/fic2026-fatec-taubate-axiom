// Erros de domínio, no mesmo espírito do `config/errors.ts` do backend: o
// serviço traduz a falha de rede em um erro que a tela sabe tratar, e a tela
// decide por `instanceof` em vez de procurar texto dentro da mensagem — texto
// muda, tipo não.

export class NotFoundError extends Error {
  constructor(message = "Não encontrado") {
    super(message)
    this.name = "NotFoundError"
  }
}
