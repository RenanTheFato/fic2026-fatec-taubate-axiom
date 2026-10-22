import { CircleCheck, Send } from "lucide-react"
import { useState } from "react"
import { flushSync } from "react-dom"
import type { FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { CheckoutError } from "../../config/errors"
import { useSession } from "../../hooks/use-session"
import { useApplyVolunteer } from "../../hooks/use-volunteer-panel"
import { authenticate } from "../../services/auth/auth-user-service"
import type { VolunteerArea, VolunteerPeriod } from "../../types/volunteer-types"
import { PASSWORD_HINT, passwordProblem } from "../../utils/password"
import { HOME_BY_ROLE } from "../admin/admin-nav"
import { Button, ButtonLink } from "../ui/button"
import { Checkbox, CheckboxGroup, Field, FieldRow, SelectInput, TextArea, TextInput } from "../ui/field"
import { StateMessage } from "../ui/states"
import { AREA_LABEL, AREAS, PERIOD_LABEL, PERIODS } from "./volunteer-labels"

type Errors = Partial<Record<"name" | "email" | "phone" | "password" | "confirm" | "area" | "availability" | "about" | "consent", string>>

const ID = "voluntario"

// O cadastro grava na API e cria a conta da pessoa junto, então ela acompanha a
// análise pelo próprio painel. A coordenação aprova no painel dela, e só então
// os turnos abertos aparecem. Enviado o cadastro, a tela entra com a conta nova
// e leva ao painel, onde a situação aparece.
export function VolunteerForm() {
  const navigate = useNavigate()
  const { signIn } = useSession()
  const apply = useApplyVolunteer()
  const [errors, setErrors] = useState<Errors>({})
  const [sentTo, setSentTo] = useState<string | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)
    const value = (name: string) => String(form.get(name) ?? "").trim()

    const input = {
      name: value("name"),
      email: value("email"),
      password: String(form.get("password") ?? ""),
      phone: value("phone"),
      city: value("city") || null,
      area: value("area") as VolunteerArea,
      availability: form.getAll("availability").map(String) as VolunteerPeriod[],
      about: value("about"),
    }

    const found: Errors = {}

    if (input.name.length < 3) found.name = "Escreva seu nome completo."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) found.email = "Escreva um e-mail válido, como nome@provedor.com."
    if (input.phone.replace(/\D/g, "").length < 10) found.phone = "Escreva um telefone com DDD."
    const weak = passwordProblem(input.password)
    if (weak) found.password = weak
    if (!weak && input.password !== String(form.get("confirm") ?? "")) found.confirm = "As duas senhas não são iguais."
    if (!input.area) found.area = "Escolha a área em que você quer ajudar."
    if (input.availability.length === 0) found.availability = "Marque pelo menos um período."
    if (input.about.length < 20) found.about = "Conte um pouco mais: pelo menos 20 caracteres."
    if (form.get("consent") !== "on") found.consent = "Precisamos da sua autorização para entrar em contato."

    // A mensagem de erro precisa existir no DOM antes de o foco chegar ao
    // campo, senão o leitor de tela anuncia o campo sem dizer o que está errado.
    flushSync(() => setErrors(found))

    const first = Object.keys(found)[0]

    if (first) {
      document.getElementById(`${ID}-${first}`)?.focus()
      return
    }

    const saved = await apply.mutateAsync(input).then(() => true).catch(() => false)

    if (!saved) return

    try {
      await signIn(await authenticate(input.email, input.password))
      navigate(HOME_BY_ROLE.volunteer)
    } catch {
      setSentTo(input.email)
    }
  }

  if (sentTo) {
    return (
      <div role="status" className="flex flex-col gap-4 rounded-card border border-success bg-success-soft p-6 text-ink">
        <p className="flex items-start gap-3 text-sm leading-relaxed">
          <CircleCheck className="size-5 shrink-0 text-success-dark" aria-hidden="true" />
          <span>
            Seu cadastro chegou à coordenação. Entre com {sentTo} e a senha que você criou para acompanhar a análise pelo painel.
          </span>
        </p>
        <ButtonLink to="/entrar" size="sm" tone="success" className="w-fit">
          Entrar no painel
        </ButtonLink>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FieldRow>
        <Field id={`${ID}-name`} label="Nome completo" error={errors.name} required>
          {(control) => <TextInput {...control} name="name" autoComplete="name" maxLength={128} />}
        </Field>

        <Field id={`${ID}-email`} label="E-mail" hint="É o seu login no painel do voluntariado." error={errors.email} required>
          {(control) => <TextInput {...control} name="email" type="email" autoComplete="email" maxLength={128} />}
        </Field>
      </FieldRow>

      <FieldRow>
        <Field id={`${ID}-phone`} label="Telefone" hint="Com DDD. É por aqui que a coordenação chama." error={errors.phone} required>
          {(control) => <TextInput {...control} name="phone" type="tel" autoComplete="tel" maxLength={20} />}
        </Field>

        <Field id={`${ID}-city`} label="Cidade">
          {(control) => <TextInput {...control} name="city" autoComplete="address-level2" maxLength={80} />}
        </Field>
      </FieldRow>

      <FieldRow>
        <Field id={`${ID}-password`} label="Crie uma senha" hint={PASSWORD_HINT} error={errors.password} required>
          {(control) => <TextInput {...control} name="password" type="password" autoComplete="new-password" maxLength={255} />}
        </Field>

        <Field id={`${ID}-confirm`} label="Repita a senha" error={errors.confirm} required>
          {(control) => <TextInput {...control} name="confirm" type="password" autoComplete="new-password" maxLength={255} />}
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
            {AREAS.map((area) => (
              <option key={area} value={area}>
                {AREA_LABEL[area]}
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
          <Checkbox key={period} name="availability" value={period} label={PERIOD_LABEL[period]} />
        ))}
      </CheckboxGroup>

      <Field
        id={`${ID}-about`}
        label="Conte um pouco sobre você"
        hint="Formação, experiência com pessoas com deficiência, o que te trouxe até aqui."
        error={errors.about}
        required
      >
        {(control) => <TextArea {...control} name="about" maxLength={2000} />}
      </Field>

      <div className="grid gap-2">
        <Checkbox
          id={`${ID}-consent`}
          name="consent"
          label="Autorizo a associação a usar meus dados para falar comigo sobre voluntariado."
        />
        {errors.consent && <p className="text-sm font-semibold text-primary">{errors.consent}</p>}
      </div>

      {apply.isError && (
        <StateMessage
          tone="error"
          title="O cadastro não foi enviado"
          description={
            apply.error instanceof CheckoutError
              ? apply.error.message
              : "Não conseguimos falar com o servidor. Os dados continuam aqui, é só tentar de novo."
          }
        />
      )}

      <Button type="submit" size="lg" tone="success" disabled={apply.isPending} className="w-full sm:w-fit">
        <Send className="size-5" aria-hidden="true" />
        {apply.isPending ? "Enviando…" : "Enviar cadastro"}
      </Button>
    </form>
  )
}
