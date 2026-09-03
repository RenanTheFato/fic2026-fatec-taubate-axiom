import { Lock } from "lucide-react"
import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useSession } from "../../hooks/use-session"
import { HOME_BY_ROLE } from "../admin/admin-nav"
import { ROLE_LABEL } from "../../types/user-types"
import type { UserRole } from "../../types/user-types"
import { ButtonLink } from "../ui/button"
import { Container } from "../ui/container"
import { Skeleton } from "../ui/states"

type RequireRoleProps = {
  roles: UserRole[]
  children: ReactNode
}

// Esconder tela não é segurança, porque quem decide continua sendo o backend,
// que responde 401 e 403 de qualquer forma. Isto existe para não frustrar:
// ninguém deve clicar num item de menu para descobrir que não podia.
//
// A distinção entre "não está logado" e "está logado sem permissão" importa:
// mandar para o login quem já entrou seria pedir de novo a mesma senha que já
// foi aceita, sem nunca explicar o que faltou.
export function RequireRole({ roles, children }: RequireRoleProps) {
  const { user, loading } = useSession()
  const location = useLocation()

  if (loading) {
    return (
      <Container className="py-16">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-6 h-64 w-full" />
      </Container>
    )
  }

  if (!user) {
    // O destino vai junto: depois de entrar, a pessoa volta para onde queria ir,
    // e não para uma home genérica.
    return <Navigate to="/entrar" replace state={{ from: location.pathname + location.search }} />
  }

  if (!roles.includes(user.role)) {
    return (
      <Container className="py-16">
        <div className="max-w-lg rounded-card border border-line bg-surface-muted p-8">
          <Lock className="size-8 text-ink-soft" aria-hidden="true" />
          <h1 className="mt-4 font-display text-2xl font-extrabold">Esta tela não é do seu perfil</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Seu acesso é de {ROLE_LABEL[user.role]}, e esta área responde a{" "}
            {roles.map((role) => ROLE_LABEL[role]).join(" ou ")}. Se você precisa entrar aqui, peça à
            administração para revisar seu perfil.
          </p>
          <div className="mt-6">
            <ButtonLink to={HOME_BY_ROLE[user.role]} size="sm">
              Voltar ao seu painel
            </ButtonLink>
          </div>
        </div>
      </Container>
    )
  }

  return <>{children}</>
}
