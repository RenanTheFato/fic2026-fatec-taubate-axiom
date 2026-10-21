import { Loader2, TicketCheck } from "lucide-react"
import { useState } from "react"
import { flushSync } from "react-dom"
import type { FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { CheckoutError } from "../../config/errors"
import { useCreateRegistration } from "../../hooks/use-registration"
import type { Event } from "../../types/event-types"
import { Button } from "../ui/button"
import { Field, FieldRow, TextInput } from "../ui/field"
import { StateMessage } from "../ui/states"

type RegistrationFormProps = {
  event: Pick<Event, "id" | "slug">
}

type Errors = Partial<Record<"name" | "email", string>>

// A inscrição no evento gratuito. Uma pessoa por inscrição, como o convite pago
// é um por pedido: quem leva acompanhante inscreve cada um, para a lista de
// presença ter o nome de quem de fato vai entrar. Inscrita a pessoa, a tela
// leva direto ao ingresso, com o QR que a portaria lê.
export function RegistrationForm({ event }: RegistrationFormProps) {
  const [errors, setErrors] = useState<Errors>({})
  const navigate = useNavigate()
  const register = useCreateRegistration(event.slug)

  function onSubmit(submitted: FormEvent<HTMLFormElement>) {
    submitted.preventDefault()

    const form = new FormData(submitted.currentTarget)
    const name = String(form.get("name") ?? "").trim()
    const email = String(form.get("email") ?? "").trim()
    const phone = String(form.get("phone") ?? "").trim()

    const found: Errors = {}

    if (name.length < 3) found.name = "Escreva o nome completo de quem vai participar."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) found.email = "Escreva um e-mail válido, como nome@provedor.com."

    flushSync(() => setErrors(found))

    if (Object.keys(found).length > 0) {
      document.getElementById(`inscricao-${Object.keys(found)[0]}`)?.focus()
      return
    }

    register.mutate(
      { event_id: event.id, participant_name: name, participant_email: email, participant_phone: phone.length >= 8 ? phone : null },
      { onSuccess: (registration) => navigate(`/inscricao/${registration.ticket_code}`) },
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Field id="inscricao-name" label="Nome de quem vai participar" error={errors.name} required>
        {(control) => <TextInput {...control} name="name" autoComplete="name" />}
      </Field>

      <FieldRow>
        <Field id="inscricao-email" label="E-mail" error={errors.email} required>
          {(control) => <TextInput {...control} name="email" type="email" autoComplete="email" />}
        </Field>

        <Field id="inscricao-phone" label="Telefone">
          {(control) => <TextInput {...control} name="phone" type="tel" autoComplete="tel" />}
        </Field>
      </FieldRow>

      {register.isError && (
        <StateMessage
          tone="error"
          title="A inscrição não foi concluída"
          description={
            register.error instanceof CheckoutError
              ? register.error.message
              : "Não conseguimos falar com o servidor. Os dados continuam aqui, é só tentar de novo."
          }
        />
      )}

      <Button type="submit" size="lg" disabled={register.isPending}>
        {register.isPending ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <TicketCheck className="size-5" aria-hidden="true" />}
        {register.isPending ? "Inscrevendo…" : "Fazer minha inscrição"}
      </Button>
    </form>
  )
}
