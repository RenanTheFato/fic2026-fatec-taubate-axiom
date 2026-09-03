// Erros de domínio, no mesmo espírito do `config/errors.ts` do backend: o
// serviço traduz a falha de rede em um erro que a tela sabe tratar, e a tela
// decide por `instanceof` em vez de procurar texto dentro da mensagem, porque texto
// muda, tipo não.

export class NotFoundError extends Error {
  constructor(message = "Não encontrado") {
    super(message)
    this.name = "NotFoundError"
  }
}

// Recusa de regra de negócio no caminho do dinheiro: evento lotado, produto sem
// estoque, campanha encerrada, checkout que não abriu. Não é falha de sistema e
// não deve aparecer como "erro inesperado": a mensagem do backend diz qual
// regra impediu a compra, e é ela que o doador precisa ler.
export class CheckoutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CheckoutError"
  }
}

// Sessão ausente, expirada ou sem permissão para a tela pedida. A área privada
// decide por este tipo se manda para o login ou se mostra "sem acesso".
export class UnauthorizedError extends Error {
  constructor(message = "Sessão expirada") {
    super(message)
    this.name = "UnauthorizedError"
  }
}
