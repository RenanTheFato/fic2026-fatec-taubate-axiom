import axios from "axios"
import { api } from "../../config/api"
import { CheckoutError } from "../../config/errors"
import type { ContactInput, WallRemovalInput } from "../../types/contact-types"

// As duas portas públicas da caixa de entrada da associação. A mensagem fica
// gravada no painel, onde a equipe lê e responde pelo e-mail informado. A
// resposta da API é só o recebimento: quem escreveu já sabe o que escreveu.

export async function sendContactMessage(input: ContactInput): Promise<void> {
  try {
    await api.post("/contact/create", input)
  } catch (error: unknown) {
    throw refusal(error)
  }
}

// O pedido de retirada do Mural do Bem. A rota nunca diz se o e-mail é de quem
// doou, então a tela também não diz: o pedido é recebido igual para todo mundo,
// e a equipe confere o cadastro no painel.
export async function requestWallRemoval(input: WallRemovalInput): Promise<void> {
  try {
    await api.post("/contact/wall-removal", input)
  } catch (error: unknown) {
    throw refusal(error)
  }
}

function refusal(error: unknown): unknown {
  if (axios.isAxiosError(error) && error.response?.status === 400) {
    return new CheckoutError("Algum campo não foi aceito. Confira nome, e-mail e mensagem e tente de novo.")
  }

  return error
}
