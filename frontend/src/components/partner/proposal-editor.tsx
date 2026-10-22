import { useRef, useState } from "react"
import { flushSync } from "react-dom"
import type { FormEvent } from "react"
import { CheckoutError } from "../../config/errors"
import { useActiveCampaigns } from "../../hooks/use-campaigns"
import { useEvents } from "../../hooks/use-events"
import { useCreateProposal } from "../../hooks/use-partner-panel"
import { isUpcoming } from "../../services/event/list-events-service"
import type { ProposalKind } from "../../types/partner-types"
import { parseMoneyInput } from "../../utils/form-input"
import { EditorPanel } from "../admin/editor-panel"
import { Field, SelectInput, TextArea, TextInput } from "../ui/field"
import { PROPOSAL_KIND } from "./partner-labels"

type ProposalEditorProps = {
  onDone: (message: string) => void
  onCancel: () => void
}

type Errors = Partial<Record<"title" | "description" | "amount" | "target", string>>

const KINDS = Object.keys(PROPOSAL_KIND) as ProposalKind[]

// O que cada tipo de proposta pede: se tem valor, como o valor se chama, e para
// onde ela pode apontar. As regras são as do backend, conferidas antes de enviar.
const RULES: Record<ProposalKind, { amount: "required" | "optional" | null; amountLabel: string; targets: ("campaign" | "event")[]; targetRequired: boolean; hint: string }> = {
  contribution: {
    amount: "required",
    amountLabel: "Valor do aporte",
    targets: ["campaign"],
    targetRequired: false,
    hint: "Dinheiro para uma campanha ou para a associação como um todo. Depois de aceito, o pagamento é feito por aqui.",
  },
  sponsorship: {
    amount: "required",
    amountLabel: "Valor do patrocínio",
    targets: ["event", "campaign"],
    targetRequired: true,
    hint: "Apoio a um evento ou a uma campanha, com a marca da empresa no material. Depois de aceito, o pagamento é feito por aqui.",
  },
  campaign: {
    amount: "optional",
    amountLabel: "Meta sugerida",
    targets: [],
    targetRequired: false,
    hint: "Uma campanha nova que a empresa gostaria de ver, ou de ajudar a fazer.",
  },
  in_kind: {
    amount: "optional",
    amountLabel: "Valor estimado",
    targets: ["campaign", "event"],
    targetRequired: false,
    hint: "Produtos ou serviços doados. A entrega é combinada com a coordenação.",
  },
  volunteering: {
    amount: null,
    amountLabel: "",
    targets: ["campaign", "event"],
    targetRequired: false,
    hint: "Um dia de voluntariado da equipe da empresa, no calendário da casa.",
  },
}

// A proposta nova da empresa aprovada. Nasce em análise; a associação responde
// no painel dela, e a resposta aparece na lista de propostas.
export function ProposalEditor({ onDone, onCancel }: ProposalEditorProps) {
  const [kind, setKind] = useState<ProposalKind>("contribution")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [target, setTarget] = useState("")
  const [errors, setErrors] = useState<Errors>({})

  const formRef = useRef<HTMLFormElement>(null)
  const create = useCreateProposal()
  const campaigns = useActiveCampaigns()
  const events = useEvents()

  const rule = RULES[kind]
  const openEvents = events.data ? events.data.events.filter((event) => isUpcoming(event)) : []

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const value = rule.amount ? parseMoneyInput(amount) : null
    const [targetKind, targetId] = target.split(":")
    const found: Errors = {}

    if (title.trim().length < 5) found.title = "Escreva um título com pelo menos 5 letras."
    if (description.trim().length < 20) found.description = "Descreva a proposta com pelo menos 20 caracteres."
    if (rule.amount === "required" && (value === null || value <= 0)) found.amount = "Informe o valor, como 5.000,00."
    if (rule.amount === "optional" && amount.trim() && value === null) found.amount = "Use só números, como 5.000,00."
    if (rule.targetRequired && !target) found.target = "Escolha o evento ou a campanha do patrocínio."

    flushSync(() => setErrors(found))

    const first = Object.keys(found)[0]

    if (first) {
      formRef.current?.querySelector<HTMLElement>(`#proposta-${first}`)?.focus()
      return
    }

    const saved = await create
      .mutateAsync({
        kind,
        title: title.trim(),
        description: description.trim(),
        amount: value,
        campaign_id: targetKind === "campaign" ? targetId : null,
        event_id: targetKind === "event" ? targetId : null,
      })
      .then(() => true)
      .catch(() => false)

    if (saved) onDone(`"${title.trim()}" foi enviada. A associação responde por aqui.`)
  }

  return (
    <EditorPanel
      id="editor-proposta"
      title="Nova proposta"
      formRef={formRef}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      saving={create.isPending}
      submitLabel="Enviar proposta"
      error={
        create.isError
          ? create.error instanceof CheckoutError
            ? create.error.message
            : "Não conseguimos falar com o servidor. A proposta continua aqui, é só tentar de novo."
          : null
      }
    >
      <Field id="proposta-kind" label="O que a empresa propõe" hint={rule.hint} required>
        {(control) => (
          <SelectInput
            {...control}
            value={kind}
            onChange={(event) => {
              setKind(event.target.value as ProposalKind)
              setTarget("")
            }}
          >
            {KINDS.map((item) => (
              <option key={item} value={item}>
                {PROPOSAL_KIND[item].label}
              </option>
            ))}
          </SelectInput>
        )}
      </Field>

      <Field id="proposta-title" label="Título" error={errors.title} required>
        {(control) => <TextInput {...control} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} />}
      </Field>

      <Field id="proposta-description" label="Descrição" hint="O que, quando e como. Quanto mais concreto, mais rápida a resposta." error={errors.description} required>
        {(control) => <TextArea {...control} value={description} onChange={(event) => setDescription(event.target.value)} maxLength={3000} />}
      </Field>

      {rule.amount && (
        <Field id="proposta-amount" label={rule.amountLabel} hint="Em reais." error={errors.amount} required={rule.amount === "required"}>
          {(control) => <TextInput {...control} inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0,00" />}
        </Field>
      )}

      {rule.targets.length > 0 && (
        <Field
          id="proposta-target"
          label={rule.targets.includes("event") && !rule.targets.includes("campaign") ? "Evento" : "Destino"}
          error={errors.target}
          required={rule.targetRequired}
        >
          {(control) => (
            <SelectInput {...control} value={target} onChange={(event) => setTarget(event.target.value)}>
              <option value="">{rule.targetRequired ? "Escolha um destino" : "A associação como um todo"}</option>
              {rule.targets.includes("campaign") && campaigns.data && campaigns.data.length > 0 && (
                <optgroup label="Campanhas no ar">
                  {campaigns.data.map((campaign) => (
                    <option key={campaign.id} value={`campaign:${campaign.id}`}>
                      {campaign.title}
                    </option>
                  ))}
                </optgroup>
              )}
              {rule.targets.includes("event") && openEvents.length > 0 && (
                <optgroup label="Próximos eventos">
                  {openEvents.map((item) => (
                    <option key={item.id} value={`event:${item.id}`}>
                      {item.title}
                    </option>
                  ))}
                </optgroup>
              )}
            </SelectInput>
          )}
        </Field>
      )}
    </EditorPanel>
  )
}
