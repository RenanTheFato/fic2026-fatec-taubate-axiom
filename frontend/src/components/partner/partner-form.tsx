import { CircleCheck, Send } from "lucide-react"
import { useState } from "react"
import { flushSync } from "react-dom"
import type { FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { CheckoutError } from "../../config/errors"
import { useApplyPartner } from "../../hooks/use-partner-panel"
import { useSession } from "../../hooks/use-session"
import { authenticate } from "../../services/auth/auth-user-service"
import type { PartnerInterest } from "../../types/partner-types"
import { PASSWORD_HINT, passwordProblem } from "../../utils/password"
import { HOME_BY_ROLE } from "../admin/admin-nav"
import { Button, ButtonLink } from "../ui/button"
import { Checkbox, CheckboxGroup, Field, FieldRow, TextArea, TextInput } from "../ui/field"
import { StateMessage } from "../ui/states"
import { INTEREST_LABEL, isValidCnpj } from "./partner-labels"

type Errors = Partial<Record<"company_name" | "document" | "phone" | "website" | "name" | "email" | "password" | "confirm" | "interests" | "message" | "consent", string>>

const ID = "parceria"

const INTERESTS = Object.keys(INTEREST_LABEL) as PartnerInterest[]

// O pedido de parceria. A empresa cria a conta junto com o pedido, então
// acompanha a análise pelo próprio painel em vez de esperar um e-mail; a
// associação aprova ou recusa no painel dela. Enviado o pedido, a tela já entra
// com a conta nova e leva ao painel, onde a situação aparece.
export function PartnerForm() {
  const navigate = useNavigate()
  const { signIn } = useSession()
  const apply = useApplyPartner()
  const [errors, setErrors] = useState<Errors>({})
  const [sentTo, setSentTo] = useState<string | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)
    const value = (name: string) => String(form.get(name) ?? "").trim()

    const input = {
      company_name: value("company_name"),
      document: value("document"),
      phone: value("phone"),
      website: value("website") || null,
      interests: form.getAll("interests").map(String) as PartnerInterest[],
      message: value("message"),
      public_listing: form.get("public_listing") === "on",
      name: value("name"),
      email: value("email"),
      password: String(form.get("password") ?? ""),
    }

    const found: Errors = {}

    if (input.company_name.length < 3) found.company_name = "Escreva o nome da empresa."
    if (!isValidCnpj(input.document)) found.document = "O CNPJ não confere. Confira os 14 números."
    if (input.phone.replace(/\D/g, "").length < 10) found.phone = "Escreva um telefone com DDD."
    if (input.website && !/^https?:\/\/\S+\.\S+/.test(input.website)) found.website = "Escreva o endereço completo, como https://www.empresa.com.br."
    if (input.name.length < 3) found.name = "Escreva o nome de quem responde pela parceria."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) found.email = "Escreva um e-mail válido, como nome@empresa.com.br."
    const weak = passwordProblem(input.password)
    if (weak) found.password = weak
    if (!weak && input.password !== String(form.get("confirm") ?? "")) found.confirm = "As duas senhas não são iguais."
    if (input.interests.length === 0) found.interests = "Marque pelo menos uma forma de apoio."
    if (input.message.length < 20) found.message = "Conte um pouco mais: pelo menos 20 caracteres."
    if (form.get("consent") !== "on") found.consent = "Precisamos da sua autorização para tratar da parceria."

    // A mensagem de erro precisa existir no DOM antes de o foco chegar ao
    // campo, senão o leitor de tela anuncia o campo sem dizer o que falta.
    flushSync(() => setErrors(found))

    const first = Object.keys(found)[0]

    if (first) {
      document.getElementById(`${ID}-${first}`)?.focus()
      return
    }

    const saved = await apply.mutateAsync(input).then(() => true).catch(() => false)

    if (!saved) return

    // O pedido está gravado. Entrar com a conta nova é conveniência: se falhar,
    // a tela diz que o pedido chegou e mostra o caminho do login.
    try {
      await signIn(await authenticate(input.email, input.password))
      navigate(HOME_BY_ROLE.partner)
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
            O pedido chegou à associação. Entre com {sentTo} e a senha que você criou para acompanhar a análise pelo painel.
          </span>
        </p>
        <ButtonLink to="/entrar" size="sm" tone="partner" className="w-fit">
          Entrar no painel
        </ButtonLink>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-5">
        <legend className="mb-1 font-display text-lg font-bold">A empresa</legend>

        <FieldRow>
          <Field id={`${ID}-company_name`} label="Nome da empresa" error={errors.company_name} required>
            {(control) => <TextInput {...control} name="company_name" autoComplete="organization" maxLength={160} />}
          </Field>

          <Field id={`${ID}-document`} label="CNPJ" hint="É o documento que sai no recibo dos aportes." error={errors.document} required>
            {(control) => <TextInput {...control} name="document" inputMode="numeric" maxLength={18} placeholder="00.000.000/0000-00" />}
          </Field>
        </FieldRow>

        <FieldRow>
          <Field id={`${ID}-phone`} label="Telefone" hint="Com DDD." error={errors.phone} required>
            {(control) => <TextInput {...control} name="phone" type="tel" autoComplete="tel" maxLength={20} />}
          </Field>

          <Field id={`${ID}-website`} label="Site" error={errors.website}>
            {(control) => <TextInput {...control} name="website" type="url" autoComplete="url" maxLength={255} placeholder="https://" />}
          </Field>
        </FieldRow>
      </fieldset>

      <fieldset className="flex flex-col gap-5">
        <legend className="mb-1 font-display text-lg font-bold">Quem responde pela parceria</legend>

        <FieldRow>
          <Field id={`${ID}-name`} label="Nome completo" error={errors.name} required>
            {(control) => <TextInput {...control} name="name" autoComplete="name" maxLength={128} />}
          </Field>

          <Field id={`${ID}-email`} label="E-mail" hint="É o login do painel da empresa." error={errors.email} required>
            {(control) => <TextInput {...control} name="email" type="email" autoComplete="email" maxLength={128} />}
          </Field>
        </FieldRow>

        <FieldRow>
          <Field id={`${ID}-password`} label="Senha" hint={PASSWORD_HINT} error={errors.password} required>
            {(control) => <TextInput {...control} name="password" type="password" autoComplete="new-password" maxLength={255} />}
          </Field>

          <Field id={`${ID}-confirm`} label="Repita a senha" error={errors.confirm} required>
            {(control) => <TextInput {...control} name="confirm" type="password" autoComplete="new-password" maxLength={255} />}
          </Field>
        </FieldRow>
      </fieldset>

      <CheckboxGroup
        id={`${ID}-interests`}
        legend="Como a empresa quer apoiar"
        hint="Marque quantas quiser. A parceria é desenhada junto com a associação."
        error={errors.interests}
        required
        columns={2}
      >
        {INTERESTS.map((interest) => (
          <Checkbox key={interest} name="interests" value={interest} label={INTEREST_LABEL[interest]} />
        ))}
      </CheckboxGroup>

      <Field
        id={`${ID}-message`}
        label="Conte sobre a empresa e a parceria"
        hint="O que a empresa faz, o que gostaria de apoiar e com que frequência."
        error={errors.message}
        required
      >
        {(control) => <TextArea {...control} name="message" maxLength={3000} />}
      </Field>

      <div className="grid gap-3">
        <Checkbox name="public_listing" label="Autorizo mostrar a marca da empresa na rede de parceiros do site." />
        <Checkbox id={`${ID}-consent`} name="consent" label="Autorizo a associação a usar estes dados para tratar da parceria." />
        {errors.consent && <p className="text-sm font-semibold text-primary">{errors.consent}</p>}
      </div>

      {apply.isError && (
        <StateMessage
          tone="error"
          title="O pedido não foi enviado"
          description={
            apply.error instanceof CheckoutError
              ? apply.error.message
              : "Não conseguimos falar com o servidor. Os dados continuam aqui, é só tentar de novo."
          }
        />
      )}

      <Button type="submit" size="lg" tone="partner" disabled={apply.isPending} className="w-full sm:w-fit">
        <Send className="size-5" aria-hidden="true" />
        {apply.isPending ? "Enviando…" : "Enviar pedido de parceria"}
      </Button>
    </form>
  )
}
