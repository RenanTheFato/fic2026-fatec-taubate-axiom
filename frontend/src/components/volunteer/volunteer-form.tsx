import { CircleCheck, Send } from "lucide-react"
import { useState } from "react"
import { flushSync } from "react-dom"
import type { FormEvent } from "react"
import { Button } from "../ui/button"
import { Checkbox, CheckboxGroup, Field, FieldRow, SelectInput, TextArea, TextInput } from "../ui/field"

const AREAS = [
  { value: "ambulatorio", label: "Ambulatório, apoio ao atendimento" },
  { value: "escola", label: "Escola de Educação Especial" },
  { value: "oficina", label: "Programa de Oficina Terapêutica" },
  { value: "eventos", label: "Eventos e campanhas" },
  { value: "comunicacao", label: "Comunicação e captação" },
  { value: "administrativo", label: "Administrativo" },
  { value: "outra", label: "Outra área" },
]

const PERIODS = [
  { value: "manha", label: "Manhã" },
  { value: "tarde", label: "Tarde" },
  { value: "noite", label: "Noite" },
  { value: "fim-de-semana", label: "Fim de semana" },
]

type Errors = Partial<Record<"name" | "email" | "phone" | "area" | "availability" | "about" | "consent", string>>

const ID = "voluntario"
const MAIL_TO = "contato@somosdobem.org.br"

// O cadastro é o mesmo caminho verificável do Fale Conosco: o formulário monta a
// mensagem e abre o programa de e-mail da pessoa. É o que existe hoje, e é
// honesto, porque a inscrição chega de fato à coordenação com todos os campos
// organizados. Quando a vertical de voluntariado existir na API, só a função de
// envio muda: os campos, a validação e o foco de erro continuam iguais.
export function VolunteerForm() {
  const [errors, setErrors] = useState<Errors>({})
  const [sent, setSent] = useState(false)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)
    const name = String(form.get("name") ?? "").trim()
    const email = String(form.get("email") ?? "").trim()
    const phone = String(form.get("phone") ?? "").trim()
    const city = String(form.get("city") ?? "").trim()
    const area = String(form.get("area") ?? "").trim()
    const about = String(form.get("about") ?? "").trim()
    const availability = form.getAll("availability").map(String)
    const consent = form.get("consent") === "on"

    const found: Errors = {}

    if (name.length < 3) found.name = "Escreva seu nome completo."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) found.email = "Escreva um e-mail válido, como nome@provedor.com."
    if (phone.replace(/\D/g, "").length < 10) found.phone = "Escreva um telefone com DDD."
    if (!area) found.area = "Escolha a área em que você quer ajudar."
    if (availability.length === 0) found.availability = "Marque pelo menos um período."
    if (about.length < 20) found.about = "Conte um pouco mais: pelo menos 20 caracteres."
    if (!consent) found.consent = "Precisamos da sua autorização para entrar em contato."

    // Mesma razão do `message-form`: a mensagem de erro precisa existir no DOM
    // antes de o foco chegar ao campo, senão o leitor de tela anuncia o campo
    // sem dizer o que está errado.
    flushSync(() => setErrors(found))

    if (Object.keys(found).length > 0) {
      const first = Object.keys(found)[0]
      document.getElementById(`${ID}-${first}`)?.focus()
      return
    }

    const areaLabel = AREAS.find((option) => option.value === area)?.label ?? area
    const periods = PERIODS.filter((period) => availability.includes(period.value))
      .map((period) => period.label)
      .join(", ")

    const body = [
      `Nome: ${name}`,
      `E-mail: ${email}`,
      `Telefone: ${phone}`,
      city ? `Cidade: ${city}` : null,
      `Área de interesse: ${areaLabel}`,
      `Disponibilidade: ${periods}`,
      "",
      about,
    ]
      .filter((line) => line !== null)
      .join("\n")

    window.location.href = `mailto:${MAIL_TO}?subject=${encodeURIComponent(
      "Cadastro de voluntariado",
    )}&body=${encodeURIComponent(body)}`
    setSent(true)
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FieldRow>
        <Field id={`${ID}-name`} label="Nome completo" error={errors.name} required>
          {(control) => <TextInput {...control} name="name" autoComplete="name" />}
        </Field>

        <Field id={`${ID}-email`} label="E-mail" error={errors.email} required>
          {(control) => <TextInput {...control} name="email" type="email" autoComplete="email" />}
        </Field>
      </FieldRow>

      <FieldRow>
        <Field
          id={`${ID}-phone`}
          label="Telefone"
          hint="Com DDD. É por aqui que a coordenação chama."
          error={errors.phone}
          required
        >
          {(control) => <TextInput {...control} name="phone" type="tel" autoComplete="tel" />}
        </Field>

        <Field id={`${ID}-city`} label="Cidade">
          {(control) => <TextInput {...control} name="city" autoComplete="address-level2" />}
        </Field>
      </FieldRow>

      <Field
        id={`${ID}-area`}
        label="Onde você quer ajudar"
        hint="Dá para mudar de área depois, conforme a necessidade da casa."
        error={errors.area}
        required
      >
        {(control) => (
          <SelectInput {...control} name="area" defaultValue="">
            <option value="" disabled>
              Escolha uma área
            </option>
            {AREAS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        )}
      </Field>

      <CheckboxGroup
        id={`${ID}-availability`}
        legend="Quando você tem disponibilidade"
        hint="Marque quantos períodos quiser."
        error={errors.availability}
        required
        columns={2}
      >
        {PERIODS.map((period) => (
          <Checkbox key={period.value} name="availability" value={period.value} label={period.label} />
        ))}
      </CheckboxGroup>

      <Field
        id={`${ID}-about`}
        label="Conte um pouco sobre você"
        hint="Formação, experiência com pessoas com deficiência, o que te trouxe até aqui."
        error={errors.about}
        required
      >
        {(control) => <TextArea {...control} name="about" />}
      </Field>

      <div className="grid gap-2">
        <Checkbox
          id={`${ID}-consent`}
          name="consent"
          label="Autorizo a associação a usar meus dados para falar comigo sobre voluntariado."
        />
        {errors.consent && (
          <p className="text-sm font-semibold text-primary">{errors.consent}</p>
        )}
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <Button type="submit" size="lg" tone="success" className="shrink-0">
          <Send className="size-5" aria-hidden="true" />
          Enviar cadastro
        </Button>

        <p className="min-w-0 text-sm text-ink-soft">
          Ou escreva direto para{" "}
          <a
            href={`mailto:${MAIL_TO}`}
            className="font-bold break-all text-primary underline underline-offset-4"
          >
            {MAIL_TO}
          </a>
        </p>
      </div>

      {sent && (
        <p
          role="status"
          className="flex items-start gap-3 rounded-card border border-success bg-success-soft p-5 text-sm leading-relaxed text-ink"
        >
          <CircleCheck className="size-5 shrink-0 text-success-dark" aria-hidden="true" />
          <span>
            Seu cadastro está pronto no seu programa de e-mail, com todos os campos organizados.
            Confira e clique em enviar por lá. Se nada abriu, copie o endereço acima e escreva pelo
            e-mail que você já usa.
          </span>
        </p>
      )}
    </form>
  )
}
