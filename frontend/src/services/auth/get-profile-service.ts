import axios from "axios"
import { api } from "../../config/api"
import { UnauthorizedError } from "../../config/errors"
import type { User } from "../../types/user-types"

type ProfileResponse = {
  user: User
}

// A sessão é reconstruída a partir do token guardado: o papel do usuário vem do
// backend a cada carga, nunca do que ficou salvo no navegador. Papel guardado no
// cliente é papel que o próprio cliente consegue editar.
export async function getProfile(): Promise<User> {
  try {
    const { data } = await api.get<ProfileResponse>("/user/profile")

    return data.user
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw new UnauthorizedError("Sessão expirada. Entre de novo.")
    }

    throw error
  }
}
