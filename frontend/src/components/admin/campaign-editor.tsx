import { useRef, useState } from "react"
import { flushSync } from "react-dom"
import type { FormEvent } from "react"
import { CheckoutError } from "../../config/errors"
import { useSaveCampaign } from "../../hooks/use-catalog-editor"
import type { Campaign } from "../../types/campaign-types"
import { fromDateInput, parseMoneyInput, toDateInput, toMoneyInput } from "../../utils/form-input"
import { Field, FieldRow, TextArea, TextInput } from "../ui/field"
import { EditorPanel } from "./editor-panel"
import { PhotoField } from "./photo-field"

type CampaignEditorProps = {
  /** Ausente: cadastrar. Presente: editar esta. */
  campaign?: Campaign
  onDone: (message: string) => void
  onCancel: () => void
}

type Errors = Partial<Record<"title" | "goal" | "starts" | "ends", string>>

// Cadastro e edição de campanha. Nasce rascunho; "Publicar", na lista, é o que
// a liga ao caixa. A edição só existe enquanto a campanha está em rascunho ou
// no ar, porque o backend não mexe em campanha encerrada ou cancelada.
export function CampaignEditor({ campaign, onDone, onCancel }: CampaignEditorProps) {
  const [title, setTitle] = useState(campaign?.title ?? "")
  const [description, setDescription] = useState(campaign?.description ?? "")
  const [goal, setGoal] = useState(toMoneyInput(campaign?.goal_amount ?? null))
  const [starts, setStarts] = useState(toDateInput(campaign?.starts_at ?? null))
  const [ends, setEnds] = useState(toDateInput(campaign?.ends_at ?? null))
  const [image, setImage] = useState<string | null>(campaign?.image_url ?? null)
  const [errors, setErrors] = useState<Errors>({})

  const formRef = useRef<HTMLFormElement>(null)
  const save = useSaveCampaign()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const goalAmount = parseMoneyInput(goal)
    const startsAt = fromDateInput(starts)
    const endsAt = fromDateInput(ends)
    const found: Errors = {}

    if (title.trim().length < 2) found.title = "Escreva um título com pelo menos 2 letras."
    if (goalAmount === null || goalAmount <= 0) found.goal = "Informe a meta em reais, como 25000 ou 25000,50."
    if (!startsAt) found.starts = "Informe a data de início."
    if (startsAt && endsAt && endsAt <= startsAt) found.ends = "O término precisa ser depois do início."

    flushSync(() => setErrors(found))

    const first = Object.keys(found)[0]

    if (first) {
      formRef.current?.querySelector<HTMLElement>(`#campanha-${first}`)?.focus()
      return
    }

    const saved = await save
      .mutateAsync({
        id: campaign?.id,
        title: title.trim(),
        description: description.trim() || null,
        image_url: image,
        goal_amount: goalAmount as number,
        starts_at: startsAt as string,
        ends_at: endsAt,
      })
      .catch(() => null)

    if (saved) {
      onDone(campaign ? `"${saved.title}" foi atualizada.` : `"${saved.title}" foi salva como rascunho. Publique quando estiver pronta.`)
    }
  }

  return (
    <EditorPanel
      id="editor-campanha"
      title={campaign ? "Editar campanha" : "Nova campanha"}
      formRef={formRef}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      saving={save.isPending}
      submitLabel={campaign ? "Salvar alterações" : "Salvar rascunho"}
      error={
        save.isError
          ? save.error instanceof CheckoutError
            ? save.error.message
            : "Não conseguimos falar com o servidor. Os dados continuam aqui, é só tentar de novo."
          : null
      }
    >
      <Field id="campanha-title" label="Título" error={errors.title} required>
        {(control) => <TextInput {...control} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={128} />}
      </Field>

      <Field id="campanha-description" label="Descrição" hint="Aparece na página da campanha.">
        {(control) => (
          <TextArea {...control} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2048} />
        )}
      </Field>

      <Field id="campanha-goal" label="Meta (R$)" error={errors.goal} required>
        {(control) => <TextInput {...control} inputMode="decimal" value={goal} onChange={(event) => setGoal(event.target.value)} />}
      </Field>

      <FieldRow>
        <Field id="campanha-starts" label="Início" error={errors.starts} required>
          {(control) => <TextInput {...control} type="date" value={starts} onChange={(event) => setStarts(event.target.value)} />}
        </Field>

        <Field id="campanha-ends" label="Término" hint="Em branco: sem data para acabar." error={errors.ends}>
          {(control) => <TextInput {...control} type="date" value={ends} onChange={(event) => setEnds(event.target.value)} />}
        </Field>
      </FieldRow>

      <PhotoField id="campanha-foto" value={image} onChange={setImage} ratio="16/9" hint="Foto que representa a campanha" />
    </EditorPanel>
  )
}
