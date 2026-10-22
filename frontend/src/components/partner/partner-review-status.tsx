import { Send } from "lucide-react"
import { useState } from "react"
import { flushSync } from "react-dom"
import type { FormEvent } from "react"
import { CheckoutError } from "../../config/errors"
import { useResubmitPartner } from "../../hooks/use-partner-panel"
import type { PartnerInterest, PartnerProfile } from "../../types/partner-types"
import { formatDate } from "../../utils/format"
import { Button } from "../ui/button"
import { Checkbox, CheckboxGroup, Field, TextArea } from "../ui/field"
import { StateMessage } from "../ui/states"
import { INTEREST_LABEL } from "./partner-labels"

const INTERESTS = Object.keys(INTEREST_LABEL) as PartnerInterest[]

function ResubmitForm({ partner }: { partner: PartnerProfile }) {
  const resubmit = useResubmitPartner()
  const [errors, setErrors] = useState<Partial<Record<"interests" | "message", string>>>({})

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)
    const interests = form.getAll("interests").map(String) as PartnerInterest[]
    const message = String(form.get("message") ?? "").trim()
    const found: typeof errors = {}

    if (interests.length === 0) found.interests = "Marque pelo menos uma forma de apoio."
    if (message.length < 20) found.message = "Conte um pouco mais: pelo menos 20 caracteres."

    flushSync(() => setErrors(found))

    const first = Object.keys(found)[0]

    if (first) {
      document.getElementById(`pedido-${first}`)?.focus()
      return
    }

    resubmit.mutate({ interests, message })
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5 rounded-card border border-line bg-surface p-5 sm:p-6">
      <h2 className="font-display text-xl font-bold">Revisar e enviar de novo</h2>

      <CheckboxGroup id="pedido-interests" legend="Como a empresa quer apoiar" error={errors.interests} required columns={2}>
        {INTERESTS.map((interest) => (
          <Checkbox key={interest} name="interests" value={interest} label={INTEREST_LABEL[interest]} defaultChecked={partner.interests.includes(interest)} />
        ))}
      </CheckboxGroup>

      <Field id="pedido-message" label="Conte sobre a empresa e a parceria" error={errors.message} required>
        {(control) => <TextArea {...control} name="message" defaultValue={partner.message ?? ""} maxLength={3000} />}
      </Field>

      {resubmit.isError && (
        <StateMessage
          tone="error"
          title="O pedido não foi reenviado"
          description={resubmit.error instanceof CheckoutError ? resubmit.error.message : "Não conseguimos falar com o servidor. Tente de novo."}
        />
      )}

      <Button type="submit" tone="partner" disabled={resubmit.isPending} className="w-full sm:w-fit">
        <Send className="size-4" aria-hidden="true" />
        Enviar de novo
      </Button>
    </form>
  )
}

// O painel de uma empresa que ainda não foi aprovada: a situação do pedido e, se
// ele foi recusado, o motivo e o caminho para mandar de novo.
export function PartnerReviewStatus({ partner }: { partner: PartnerProfile }) {
  if (partner.status === "pending") {
    return (
      <StateMessage
        title="O pedido de parceria está em análise"
        description={`A associação recebeu o pedido em ${formatDate(partner.created_at)}. Assim que ele for aprovado, este painel libera as propostas de campanha, aporte e patrocínio.`}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <StateMessage
        tone="error"
        title="O pedido não foi aprovado desta vez"
        description={partner.review_note ?? "A associação não deixou o motivo. Fale com a captação."}
      />
      <ResubmitForm partner={partner} />
    </div>
  )
}
