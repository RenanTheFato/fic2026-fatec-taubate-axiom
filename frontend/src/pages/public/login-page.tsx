import { useMutation } from "@tanstack/react-query"
import { Loader2, LogIn } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { HOME_BY_ROLE } from "../../components/admin/admin-nav"
import { Logo } from "../../components/layout/logo"
import { Button } from "../../components/ui/button"
import { Field, TextInput } from "../../components/ui/field"
import { StateMessage } from "../../components/ui/states"
import { UnauthorizedError } from "../../config/errors"
import { useSession } from "../../hooks/use-session"
import { authenticate } from "../../services/auth/auth-user-service"

type LocationState = { from?: string }

// Login único para todos os papéis. Não existe uma tela por perfil: quem decide
// o que a pessoa vê é o papel que volta do backend, e o redirecionamento leva
// cada um para onde ele trabalha.
export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signIn } = useSession()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const formRef = useRef<HTMLFormElement>(null)

  const from = (location.state as LocationState | null)?.from

  // Quem já tem sessão não precisa ver o formulário de novo. O efeito espera o
  // perfil chegar, porque o papel é o que decide o destino.
  useEffect(() => {
    if (user) {
      navigate(from ?? HOME_BY_ROLE[user.role], { replace: true })
    }
  }, [user, from, navigate])

  const login = useMutation({
    mutationFn: () => authenticate(email.trim(), password),
    retry: false,
    onSuccess: async (token) => {
      await signIn(token)
    },
  })

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const found: { email?: string; password?: string } = {}

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      found.email = "Informe um e-mail válido."
    }

    if (password.length === 0) {
      found.password = "Informe a sua senha."
    }

    // Mesma razão do `checkout-form`: a mensagem de erro precisa existir antes
    // de o foco chegar ao campo.
    flushSync(() => setErrors(found))

    const first = Object.keys(found)[0]

    if (first) {
      formRef.current?.querySelector<HTMLElement>(`#entrar-${first}`)?.focus()
      return
    }

    login.mutate()
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-surface-muted px-5 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center">
          <Logo className="h-14" />
        </div>

        <div className="mt-8 rounded-card border border-line bg-surface p-6 sm:p-8">
          <h1 className="font-display text-2xl font-extrabold">Entrar</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Acesso da equipe da associação. Doar, comprar e conferir um recibo não exigem conta.
          </p>

          <form ref={formRef} onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-5">
            <Field id="entrar-email" label="E-mail" error={errors.email} required>
              {(control) => (
                <TextInput
                  {...control}
                  type="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              )}
            </Field>

            <Field id="entrar-password" label="Senha" error={errors.password} required>
              {(control) => (
                <TextInput
                  {...control}
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              )}
            </Field>

            {login.isError && (
              <StateMessage
                tone="error"
                title="Não foi possível entrar"
                description={
                  login.error instanceof UnauthorizedError
                    ? login.error.message
                    : "Não conseguimos falar com o servidor agora. Tente de novo em instantes."
                }
              />
            )}

            <Button type="submit" size="lg" fullWidth disabled={login.isPending}>
              {login.isPending ? (
                <>
                  <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                  Entrando…
                </>
              ) : (
                <>
                  <LogIn className="size-5" aria-hidden="true" />
                  Entrar
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-ink-soft">
          Esqueceu a senha? Fale com a administração da associação.{" "}
          <Link to="/" className="font-bold text-primary underline underline-offset-4">
            Voltar ao site
          </Link>
        </p>
      </div>
    </div>
  )
}
