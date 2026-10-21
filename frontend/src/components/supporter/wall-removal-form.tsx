import { CircleCheck, EyeOff, Loader2 } from "lucide-react"
import { useState } from "react"
import { flushSync } from "react-dom"
import type { FormEvent } from "react"
import { CheckoutError } from "../../config/errors"
import { useRequestWallRemoval } from "../../hooks/use-contact"
import { Button } from "../ui/button"
import { Field, FieldRow, TextArea, TextInput } from "../ui/field"
import { StateMessage } from "../ui/states"

type Errors = Partial<Record<"name" | "email", string>>

// O pedido de quem quer tirar o nome do Mural do Bem. A tela nunca diz se o
// e-mail é de quem doou, nem afirma que o nome já saiu: a equipe confere o
// cadastro no painel e faz a retirada de lá. A confirmação diz exatamente isso.
export function WallRemovalForm() {
  const [errors, setErrors] = useState<Errors>({})
  const [sentTo, setSentTo] = useState<string | null>(null)
  const request = useRequestWallRemoval()

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const name = String(form.get("name") ?? "").trim()
    const email = String(form.get("email") ?? "").trim()
    const message = String(form.get("message") ?? "").trim()

    const found: Errors = {}

    if (name.length < 2) found.name = "Escreva o nome como ele aparece no mural."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) found.email = "Escreva um e-mail válido, como nome@provedor.com."

    flushSync(() => setErrors(found))

    if (Object.keys(found).length > 0) {
      document.getElementById(`retirada-${Object.keys(found)[0]}`)?.focus()
      return
    }

    setSentTo(null)

    request.mutate(
      { name, email, message: message || null },
      {
        onSuccess: () => {
          formElement.reset()
          setSentTo(email)
        },
      },
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FieldRow>
        <Field id="retirada-name" label="Nome como aparece no mural" error={errors.name} required>
          {(control) => <TextInput {...control} name="name" autoComplete="name" />}
        </Field>

        <Field id="retirada-email" label="E-mail usado na contribuição" error={errors.email} required>
          {(control) => <TextInput {...control} name="email" type="email" autoComplete="email" />}
        </Field>
      </FieldRow>

      <Field id="retirada-message" label="Observação" hint="Se doou com outro e-mail, conte aqui.">
        {(control) => <TextArea {...control} name="message" rows={3} maxLength={2000} />}
      </Field>

      {request.isError && (
        <StateMessage
          tone="error"
          title="O pedido não foi enviado"
          description={
            request.error instanceof CheckoutError
              ? request.error.message
              : "Não conseguimos falar com o servidor. Tente de novo, ou escreva para contato@somosdobem.org.br."
          }
        />
      )}

      <div>
        <Button type="submit" tone="partner" disabled={request.isPending}>
          {request.isPending ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <EyeOff className="size-5" aria-hidden="true" />}
          {request.isPending ? "Enviando…" : "Pedir a retirada"}
        </Button>
      </div>

      {sentTo && (
        <p role="status" className="flex items-start gap-3 rounded-card border border-success bg-success-soft p-5 text-sm leading-relaxed text-ink">
          <CircleCheck className="size-5 shrink-0 text-success-dark" aria-hidden="true" />
          <span className="min-w-0">
            Recebemos o pedido. A equipe confere o cadastro, tira o nome do mural e avisa no e-mail{" "}
            <strong className="break-all">{sentTo}</strong>.
          </span>
        </p>
      )}
    </form>
  )
}
