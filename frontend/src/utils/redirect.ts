// A única saída do app para fora dele: o ambiente de pagamento do gateway.
//
// Existe como função nomeada, e não como `window.location.assign` solto dentro
// do formulário, porque é uma fronteira do sistema, pela mesma razão que faz o
// Axios morar em `config/api.ts`. E porque uma fronteira nomeada pode ser
// dublada no teste sem mexer no `window`, que em jsdom quebra de formas difíceis
// de diagnosticar.
export function redirectTo(url: string): void {
  window.location.assign(url)
}
