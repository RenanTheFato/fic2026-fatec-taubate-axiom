import { createContext, use } from "react"
import type { User, UserRole } from "../types/user-types"

// O contexto da sessão mora aqui, e não junto do provider, para que o arquivo
// do provider exporte só o componente, pela mesma razão do `use-reading-mode.ts`:
// é o que o `oxlint` cobra e o que mantém o fast refresh funcionando.

export type SessionValue = {
  user: User | null
  /** Verdadeiro só enquanto o perfil ainda não voltou do backend na primeira carga. */
  loading: boolean
  signIn: (token: string) => Promise<void>
  signOut: () => void
  can: (roles: UserRole[]) => boolean
}

export const SessionContext = createContext<SessionValue | null>(null)

export function useSession(): SessionValue {
  const context = use(SessionContext)

  if (!context) throw new Error("useSession precisa estar dentro de SessionProvider")

  return context
}
