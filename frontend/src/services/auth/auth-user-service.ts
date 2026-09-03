import axios from "axios"
import { api } from "../../config/api"
import { UnauthorizedError } from "../../config/errors"

type AuthResponse = {
  token: string
}

// `POST /user/auth` devolve a mesma mensagem para e-mail desconhecido e para
// senha errada. É assim de propósito no backend, para não confirmar quem tem
// conta. A tela repete essa mensagem única em vez de tentar adivinhar qual dos
// dois foi.
export async function authenticate(email: string, password: string): Promise<string> {
  try {
    const { data } = await api.post<AuthResponse>("/user/auth", { email, password })

    return data.token
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 400)) {
      throw new UnauthorizedError("E-mail ou senha inválidos.")
    }

    throw error
  }
}
