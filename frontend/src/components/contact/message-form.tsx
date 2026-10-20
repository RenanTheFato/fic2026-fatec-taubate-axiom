import { CircleCheck, Loader2, Send } from "lucide-react"
import { useState } from "react"
import { flushSync } from "react-dom"
import type { FormEvent } from "react"
import { CheckoutError } from "../../config/errors"
import { useSendMessage } from "../../hooks/use-contact"
import type { ContactInput } from "../../types/contact-types"
import { Button } from "../ui/button"
import { Field, FieldRow, SelectInput, TextArea, TextInput } from "../ui/field"
import { StateMessage } from "../ui/states"
import { CONTACT_SUBJECTS } from "./contact-labels"

const MAIL_TO = "contato@somosdobem.org.br"

type MessageFormProps = {
  /** Prefixo dos ids dos campos: a página pode ter mais de um formulário. */
  id: string
  channel: ContactInput["channel"]
  subjectLabel: string
  submitLabel: string
  note?: string
}

type Errors = Partial<Record<"name" | "email" | "subject" | "message", string>>

// Os formulários de contato, ouvidoria e candidatura. A mensagem é gravada na
// caixa de entrada do painel, onde a equipe lê e responde pelo e-mail
// informado. A confirmação só aparece depois que a API disse que guardou; se a
// rede falhar, o texto continua no formulário e o e-mail da associação fica à
// vista, como caminho alternativo de verdade.
export function MessageForm({ id, channel, subjectLabel, submitLabel, note }: MessageFormProps) {
  const [errors, setErrors] = useState<Errors>({})
  const [sentTo, setSentTo] = useState<string | null>(null)
  const send = useSendMessage()
  const subjects = CONTACT_SUBJECTS[channel]

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const name = String(form.get("name") ?? "").trim()
    const email = String(form.get("email") ?? "").trim()
    const phone = String(form.get("phone") ?? "").trim()
    const subject = String(form.get("subject") ?? "").trim()
    const message = String(form.get("message") ?? "").trim()

    const found: Errors = {}

    if (name.length < 3) found.name = "Escreva seu nome completo."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) found.email = "Escreva um e-mail válido, como nome@provedor.com."
    if (!subject) found.subject = "Escolha um assunto."
    if (message.length < 20) found.message = "Conte um pouco mais: pelo menos 20 caracteres."

    // Mesma razão do `checkout-form`: a mensagem de erro precisa existir antes
    // de o foco chegar ao campo.
    flushSync(() => setErrors(found))

    if (Object.keys(found).length > 0) {
      const firstInvalid = document.getElementById(`${id}-${Object.keys(found)[0]}`)
      firstInvalid?.focus()
      return
    }

    setSentTo(null)

    send.mutate(
      { channel, subject, name, email, phone: phone.length >= 8 ? phone : null, message },
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
        <Field id={`${id}-name`} label="Nome completo" error={errors.name} required>
          {(control) => <TextInput {...control} name="name" autoComplete="name" />}
        </Field>

        <Field id={`${id}-email`} label="E-mail" error={errors.email} required>
          {(control) => <TextInput {...control} name="email" type="email" autoComplete="email" />}
        </Field>
      </FieldRow>

      <FieldRow>
        <Field id={`${id}-phone`} label="Telefone" hint="Se preferir que a gente ligue.">
          {(control) => <TextInput {...control} name="phone" type="tel" autoComplete="tel" />}
        </Field>

        <Field id={`${id}-subject`} label={subjectLabel} error={errors.subject} required>
          {(control) => (
            <SelectInput {...control} name="subject" defaultValue="">
              <option value="" disabled>
                Escolha uma opção
              </option>
              {subjects.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          )}
        </Field>
      </FieldRow>

      <Field id={`${id}-message`} label="Mensagem" error={errors.message} required>
        {(control) => <TextArea {...control} name="message" />}
      </Field>

      {note && <p className="text-sm text-ink-soft">{note}</p>}

      {send.isError && (
        <StateMessage
          tone="error"
          title="A mensagem não foi enviada"
          description={
            send.error instanceof CheckoutError
              ? send.error.message
              : `Não conseguimos falar com o servidor. O texto continua aqui: tente de novo, ou escreva para ${MAIL_TO}.`
          }
        />
      )}

      {/* O endereço de e-mail não tem onde quebrar: sem `min-w-0` e sem
          `break-all` ele empurra o botão e corta o rótulo. */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <Button type="submit" size="lg" className="shrink-0" disabled={send.isPending}>
          {send.isPending ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Send className="size-5" aria-hidden="true" />}
          {send.isPending ? "Enviando…" : submitLabel}
        </Button>

        <p className="min-w-0 text-sm text-ink-soft">
          Ou escreva direto para{" "}
          <a href={`mailto:${MAIL_TO}`} className="font-bold break-all text-primary underline underline-offset-4">
            {MAIL_TO}
          </a>
        </p>
      </div>

      {sentTo && (
        <p role="status" className="flex items-start gap-3 rounded-card border border-success bg-success-soft p-5 text-sm leading-relaxed text-ink">
          <CircleCheck className="size-5 shrink-0 text-success-dark" aria-hidden="true" />
          <span className="min-w-0">
            Recebemos sua mensagem. A equipe da associação responde no e-mail{" "}
            <strong className="break-all">{sentTo}</strong>.
          </span>
        </p>
      )}
    </form>
  )
}
