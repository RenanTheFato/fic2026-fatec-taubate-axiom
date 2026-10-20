import { useRef, useState } from "react"
import { flushSync } from "react-dom"
import type { FormEvent } from "react"
import { CheckoutError } from "../../config/errors"
import { useAllCampaigns } from "../../hooks/use-admin-catalog"
import { useSaveEvent } from "../../hooks/use-catalog-editor"
import type { ApiEvent } from "../../types/event-types"
import { fromDateTimeInput, parseMoneyInput, toDateTimeInput, toMoneyInput } from "../../utils/form-input"
import { Field, FieldRow, SelectInput, TextArea, TextInput } from "../ui/field"
import { EditorPanel } from "./editor-panel"
import { PhotoField } from "./photo-field"

type EventEditorProps = {
  /** Ausente: cadastrar. Presente: editar este. */
  event?: ApiEvent
  onDone: (message: string) => void
  onCancel: () => void
}

type Errors = Partial<Record<"title" | "starts" | "ends" | "price" | "capacity", string>>

// Cadastro e edição de evento. Nasce rascunho; "Publicar", na lista, o põe na
// agenda. Valor zero é o evento gratuito, com inscrição pelo site em vez de
// convite pago, e lotação em branco é o evento sem limite de vagas.
export function EventEditor({ event, onDone, onCancel }: EventEditorProps) {
  const [title, setTitle] = useState(event?.title ?? "")
  const [description, setDescription] = useState(event?.description ?? "")
  const [location, setLocation] = useState(event?.location ?? "")
  const [campaignId, setCampaignId] = useState(event?.campaign_id ?? "")
  const [starts, setStarts] = useState(toDateTimeInput(event?.starts_at ?? null))
  const [ends, setEnds] = useState(toDateTimeInput(event?.ends_at ?? null))
  const [price, setPrice] = useState(event && Number(event.ticket_price) > 0 ? toMoneyInput(event.ticket_price) : "")
  const [capacity, setCapacity] = useState(event?.capacity ? String(event.capacity) : "")
  const [image, setImage] = useState<string | null>(event?.image_url ?? null)
  const [errors, setErrors] = useState<Errors>({})

  const formRef = useRef<HTMLFormElement>(null)
  const save = useSaveEvent()
  const campaigns = useAllCampaigns()

  // Campanha cancelada não recebe evento novo (o backend recusa), mas a que o
  // evento já tem continua na lista, para a edição não trocar o vínculo calada.
  const options = (campaigns.data ?? []).filter(
    (campaign) => campaign.status !== "cancelled" || campaign.id === event?.campaign_id,
  )

  async function handleSubmit(submitted: FormEvent<HTMLFormElement>) {
    submitted.preventDefault()

    const startsAt = fromDateTimeInput(starts)
    const endsAt = fromDateTimeInput(ends)
    const ticketPrice = price.trim() ? parseMoneyInput(price) : 0
    const seats = capacity.trim() ? Number(capacity) : null
    const found: Errors = {}

    if (title.trim().length < 2) found.title = "Escreva um título com pelo menos 2 letras."
    if (!startsAt) found.starts = "Informe a data e o horário de início."
    if (startsAt && endsAt && endsAt <= startsAt) found.ends = "O término precisa ser depois do início."
    if (ticketPrice === null) found.price = "Informe o valor em reais, como 120 ou 120,50. Para entrada gratuita, deixe em branco."

    if (seats !== null && (!Number.isInteger(seats) || seats <= 0)) {
      found.capacity = "A lotação é um número inteiro de vagas. Em branco, o evento não tem limite."
    } else if (event && seats !== null && seats < event.taken_seats) {
      found.capacity = `Já há ${event.taken_seats} vagas ocupadas. A lotação não pode ficar abaixo disso.`
    }

    flushSync(() => setErrors(found))

    const first = Object.keys(found)[0]

    if (first) {
      formRef.current?.querySelector<HTMLElement>(`#evento-${first}`)?.focus()
      return
    }

    const saved = await save
      .mutateAsync({
        id: event?.id,
        input: {
          campaign_id: campaignId || null,
          title: title.trim(),
          description: description.trim() || null,
          location: location.trim() || null,
          image_url: image,
          starts_at: startsAt as string,
          ends_at: endsAt,
          ticket_price: ticketPrice as number,
        },
        capacity: seats,
        capacityChanged: event !== undefined && seats !== event.capacity,
      })
      .catch(() => null)

    if (saved) {
      onDone(event ? `"${saved.title}" foi atualizado.` : `"${saved.title}" foi salvo como rascunho. Publique para pôr na agenda.`)
    }
  }

  return (
    <EditorPanel
      id="editor-evento"
      title={event ? "Editar evento" : "Novo evento"}
      formRef={formRef}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      saving={save.isPending}
      submitLabel={event ? "Salvar alterações" : "Salvar rascunho"}
      error={
        save.isError
          ? save.error instanceof CheckoutError
            ? save.error.message
            : "Não conseguimos falar com o servidor. Os dados continuam aqui, é só tentar de novo."
          : null
      }
    >
      <Field id="evento-title" label="Título" error={errors.title} required>
        {(control) => <TextInput {...control} value={title} onChange={(change) => setTitle(change.target.value)} maxLength={128} />}
      </Field>

      <Field id="evento-description" label="Descrição" hint="Aparece na página do evento.">
        {(control) => (
          <TextArea {...control} rows={4} value={description} onChange={(change) => setDescription(change.target.value)} maxLength={2048} />
        )}
      </Field>

      <FieldRow>
        <Field id="evento-location" label="Local">
          {(control) => <TextInput {...control} value={location} onChange={(change) => setLocation(change.target.value)} maxLength={255} />}
        </Field>

        <Field id="evento-campaign" label="Campanha" hint="A renda dos convites entra nela.">
          {(control) => (
            <SelectInput {...control} value={campaignId} onChange={(change) => setCampaignId(change.target.value)}>
              <option value="">Nenhuma</option>
              {options.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.title}
                </option>
              ))}
            </SelectInput>
          )}
        </Field>
      </FieldRow>

      <FieldRow>
        <Field id="evento-starts" label="Início" error={errors.starts} required>
          {(control) => <TextInput {...control} type="datetime-local" value={starts} onChange={(change) => setStarts(change.target.value)} />}
        </Field>

        <Field id="evento-ends" label="Término" error={errors.ends}>
          {(control) => <TextInput {...control} type="datetime-local" value={ends} onChange={(change) => setEnds(change.target.value)} />}
        </Field>
      </FieldRow>

      <FieldRow>
        <Field id="evento-price" label="Valor do convite (R$)" hint="Em branco: entrada gratuita, com inscrição pelo site." error={errors.price}>
          {(control) => <TextInput {...control} inputMode="decimal" value={price} onChange={(change) => setPrice(change.target.value)} />}
        </Field>

        <Field
          id="evento-capacity"
          label="Lotação"
          hint={event && event.taken_seats > 0 ? `Em branco: sem limite. ${event.taken_seats} vagas já ocupadas.` : "Em branco: sem limite de vagas."}
          error={errors.capacity}
        >
          {(control) => (
            <TextInput {...control} type="number" min="1" step="1" value={capacity} onChange={(change) => setCapacity(change.target.value)} />
          )}
        </Field>
      </FieldRow>

      <PhotoField id="evento-foto" value={image} onChange={setImage} ratio="16/9" hint="Foto do evento acontecendo" />
    </EditorPanel>
  )
}
