import axios from "axios"
import { api } from "../../config/api"
import { CheckoutError, NotFoundError } from "../../config/errors"
import type { CreatedRegistration, RegistrationInput, Ticket } from "../../types/registration-types"

// A inscrição no evento gratuito. O convite pago não passa por aqui: a
// inscrição dele nasce na confirmação do pagamento, e o código aparece na tela
// de status do pedido.
export async function createRegistration(input: RegistrationInput): Promise<CreatedRegistration> {
  try {
    const { data } = await api.post<{ registration: CreatedRegistration }>("/registration/create", input)

    return data.registration
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new CheckoutError("Este evento não está mais recebendo inscrições.")
    }

    // O backend recusa com 400 a vaga que acabou no meio do caminho e a
    // inscrição repetida. A tela não adivinha qual das duas foi: diz as duas,
    // e a página do evento volta a perguntar quantas vagas restam.
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      throw new CheckoutError(
        "A inscrição não foi concluída. As vagas podem ter acabado agora, ou já existe uma inscrição com este nome e e-mail neste evento.",
      )
    }

    throw error
  }
}

// A página do ingresso. O código é a credencial; 404 é uma resposta ("não
// existe esse código"), não uma falha.
export async function getTicket(code: string): Promise<Ticket> {
  try {
    const { data } = await api.get<{ ticket: Ticket }>(`/registration/ticket/${encodeURIComponent(code)}`)

    return data.ticket
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 400)) {
      throw new NotFoundError("Ingresso não encontrado")
    }

    throw error
  }
}
