import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { clearToken, readToken, writeToken } from "../config/session-storage"
import { SessionContext } from "../hooks/use-session"
import type { SessionValue } from "../hooks/use-session"
import { getProfile } from "../services/auth/get-profile-service"

// Sessão é preocupação transversal, que é exatamente para isso que Context existe
// neste projeto, e não para carregar dado de tela.
//
// O usuário não é guardado em `useState`: ele é uma leitura do servidor como
// qualquer outra, então quem o mantém é o React Query. Espelhar o perfil num
// estado local criaria duas cópias da mesma verdade, e a que envelhece é sempre
// a do cliente.
export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  // O token, ao contrário do perfil, precisa ser estado. `enabled` é lido
  // durante a renderização: se viesse de `readToken()` direto, gravar o token no
  // login não re-renderizaria ninguém, a query continuaria desligada e o perfil
  // nunca chegaria, e a sessão ficava presa em "deslogada" até um F5. O
  // `localStorage` segue sendo onde o token persiste; este estado é só o aviso
  // de que ele mudou.
  const [token, setToken] = useState(readToken)

  const { data, isLoading } = useQuery({
    queryKey: ["session", "profile"],
    queryFn: getProfile,
    // Sem token não há o que perguntar, e uma requisição garantidamente 401 na
    // abertura de toda página pública seria ruído puro.
    enabled: token !== null,
    retry: false,
    staleTime: 5 * 60_000,
  })

  const signIn = useCallback(
    async (nextToken: string) => {
      writeToken(nextToken)
      setToken(nextToken)

      // `fetchQuery` ignora o `enabled` e só resolve quando o perfil chega, então
      // quem chamou `signIn` já sabe o papel quando a promessa termina, e é isso que
      // mantém o botão em "Entrando…" até haver para onde navegar. `staleTime: 0`
      // impede que o perfil de uma sessão anterior seja reaproveitado.
      await queryClient.fetchQuery({
        queryKey: ["session", "profile"],
        queryFn: getProfile,
        staleTime: 0,
      })
    },
    [queryClient],
  )

  const signOut = useCallback(() => {
    clearToken()
    setToken(null)
    // Sair tem que apagar todo o cache, não só o perfil: transações, doadores e
    // recibos já carregados são dados de outra pessoa se alguém entrar depois.
    queryClient.clear()
  }, [queryClient])

  const value = useMemo<SessionValue>(() => {
    const user = data ?? null

    return {
      user,
      loading: isLoading,
      signIn,
      signOut,
      can: (roles) => (user ? roles.includes(user.role) : false),
    }
  }, [data, isLoading, signIn, signOut])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
