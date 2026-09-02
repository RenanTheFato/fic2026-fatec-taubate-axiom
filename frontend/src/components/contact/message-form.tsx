import { CircleCheck, Send } from "lucide-react"
import { useState } from "react"
import type { FormEvent } from "react"
import { Button } from "../ui/button"
import { Field, SelectInput, TextArea, TextInput } from "../ui/field"

type Subject = {
  value: string
  label: string
}

type MessageFormProps = {
  /** Prefixo dos ids dos campos: a página pode ter mais de um formulário. */
  id: string
  subjects: Subject[]
  subjectLabel: string
  mailTo: string
  submitLabel: string
  note?: string
}

type Errors = Partial<Record<"name" | "email" | "subject" | "message", string>>

// Não existe rota de contato no backend, e inventar um "enviado com sucesso"
// que não envia nada seria a pior mentira possível numa página de ouvidoria.
// Então o formulário monta a mensagem e abre o programa de e-mail do usuário,
// que é um caminho real e verificável — e a tela mostra o endereço por extenso
// para quem não usa cliente de e-mail no navegador.
export function MessageForm({ id, subjects, subjectLabel, mailTo, submitLabel, note }: MessageFormProps) {
  const [errors, setErrors] = useState<Errors>({})
  const [sent, setSent] = useState(false)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)
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

    setErrors(found)

    if (Object.keys(found).length > 0) {
      const firstInvalid = document.getElementById(`${id}-${Object.keys(found)[0]}`)
      firstInvalid?.focus()
      return
    }

    const chosen = subjects.find((option) => option.value === subject)?.label ?? subject
    const body = [
      `Nome: ${name}`,
      `E-mail: ${email}`,
      phone ? `Telefone: ${phone}` : null,
      "",
      message,
    ]
      .filter((line) => line !== null)
      .join("\n")

    window.location.href = `mailto:${mailTo}?subject=${encodeURIComponent(chosen)}&body=${encodeURIComponent(body)}`
    setSent(true)
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={`${id}-name`} label="Nome completo" error={errors.name} required>
          {(control) => <TextInput {...control} name="name" autoComplete="name" />}
        </Field>

        <Field id={`${id}-email`} label="E-mail" error={errors.email} required>
          {(control) => <TextInput {...control} name="email" type="email" autoComplete="email" />}
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
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
      </div>

      <Field id={`${id}-message`} label="Mensagem" error={errors.message} required>
        {(control) => <TextArea {...control} name="message" />}
      </Field>

      {note && <p className="text-sm text-ink-soft">{note}</p>}

      {/* O endereço de e-mail não tem onde quebrar: sem `min-w-0` e sem
          `break-all` ele empurra o botão e corta o rótulo. */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <Button type="submit" size="lg" className="shrink-0">
          <Send className="size-5" aria-hidden="true" />
          {submitLabel}
        </Button>

        <p className="min-w-0 text-sm text-ink-soft">
          Ou escreva direto para{" "}
          <a
            href={`mailto:${mailTo}`}
            className="font-bold break-all text-primary underline underline-offset-4"
          >
            {mailTo}
          </a>
        </p>
      </div>

      {sent && (
        <p role="status" className="flex items-start gap-3 rounded-card border border-success bg-success-soft p-5 text-sm leading-relaxed text-ink">
          <CircleCheck className="size-5 shrink-0 text-success-dark" aria-hidden="true" />
          <span>
            Abrimos o seu programa de e-mail com a mensagem preenchida. <strong>Ela ainda não foi
            enviada</strong> — confira e clique em enviar por lá. Se nada abriu, copie o endereço
            acima e escreva pelo e-mail que você já usa.
          </span>
        </p>
      )}
    </form>
  )
}
