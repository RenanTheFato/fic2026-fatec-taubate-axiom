import { useRef, useState } from "react"
import { flushSync } from "react-dom"
import type { FormEvent } from "react"
import { CheckoutError } from "../../config/errors"
import { useCreateShift } from "../../hooks/use-admin-volunteers"
import type { VolunteerArea } from "../../types/volunteer-types"
import { AREA_LABEL, AREAS } from "../volunteer/volunteer-labels"
import { Field, FieldRow, SelectInput, TextArea, TextInput } from "../ui/field"
import { EditorPanel } from "./editor-panel"

type ShiftEditorProps = {
  onDone: (message: string) => void
  onCancel: () => void
}

type Errors = Partial<Record<"activity" | "place" | "coordinator" | "date" | "from" | "to" | "slots", string>>

const MAX_HOURS = 12

// O dia e os dois horários viram data com hora local, que a API recebe em ISO:
// é a mesma conversão do `form-input`, aqui com o dia separado da hora porque
// um turno começa e termina no mesmo dia.
function atLocal(date: string, time: string): Date | null {
  if (!date || !time) return null

  const value = new Date(`${date}T${time}:00`)

  return Number.isNaN(value.getTime()) ? null : value
}

// Abrir um turno na escala. Ele aparece para todo voluntário aprovado, que
// escolhe participar; a coordenação confirma quem conta e, depois, fecha a
// presença.
export function ShiftEditor({ onDone, onCancel }: ShiftEditorProps) {
  const [activity, setActivity] = useState("")
  const [area, setArea] = useState<VolunteerArea>("eventos")
  const [place, setPlace] = useState("")
  const [coordinator, setCoordinator] = useState("")
  const [date, setDate] = useState("")
  const [from, setFrom] = useState("09:00")
  const [to, setTo] = useState("12:00")
  const [slots, setSlots] = useState("3")
  const [description, setDescription] = useState("")
  const [errors, setErrors] = useState<Errors>({})

  const formRef = useRef<HTMLFormElement>(null)
  const create = useCreateShift()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const starts = atLocal(date, from)
    const ends = atLocal(date, to)
    const count = Number(slots)
    const found: Errors = {}

    if (activity.trim().length < 3) found.activity = "Diga qual é a atividade."
    if (place.trim().length < 3) found.place = "Diga onde o turno acontece."
    if (coordinator.trim().length < 3) found.coordinator = "Diga quem coordena o turno."
    if (!starts) found.date = "Escolha o dia."
    else if (starts.getTime() <= Date.now()) found.date = "O turno precisa começar no futuro."
    if (starts && ends && ends <= starts) found.to = "O fim precisa ser depois do início."
    if (starts && ends && ends.getTime() - starts.getTime() > MAX_HOURS * 3_600_000) found.to = `Um turno dura no máximo ${MAX_HOURS} horas.`
    if (!Number.isInteger(count) || count < 1 || count > 200) found.slots = "Use um número de vagas entre 1 e 200."

    flushSync(() => setErrors(found))

    const first = Object.keys(found)[0]

    if (first || !starts || !ends) {
      formRef.current?.querySelector<HTMLElement>(`#turno-${first}`)?.focus()
      return
    }

    const saved = await create
      .mutateAsync({
        activity: activity.trim(),
        area,
        place: place.trim(),
        coordinator: coordinator.trim(),
        description: description.trim() || null,
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        slots: count,
      })
      .then(() => true)
      .catch(() => false)

    if (saved) onDone(`"${activity.trim()}" entrou na escala. Os voluntários aprovados já podem escolher o turno.`)
  }

  return (
    <EditorPanel
      id="editor-turno"
      title="Novo turno"
      formRef={formRef}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      saving={create.isPending}
      submitLabel="Abrir turno"
      error={
        create.isError
          ? create.error instanceof CheckoutError
            ? create.error.message
            : "Não conseguimos falar com o servidor. Os dados continuam aqui, é só tentar de novo."
          : null
      }
    >
      <FieldRow>
        <Field id="turno-activity" label="Atividade" error={errors.activity} required>
          {(control) => <TextInput {...control} value={activity} onChange={(event) => setActivity(event.target.value)} maxLength={160} />}
        </Field>

        <Field id="turno-area" label="Frente" required>
          {(control) => (
            <SelectInput {...control} value={area} onChange={(event) => setArea(event.target.value as VolunteerArea)}>
              {AREAS.map((item) => (
                <option key={item} value={item}>
                  {AREA_LABEL[item]}
                </option>
              ))}
            </SelectInput>
          )}
        </Field>
      </FieldRow>

      <FieldRow>
        <Field id="turno-place" label="Local" error={errors.place} required>
          {(control) => <TextInput {...control} value={place} onChange={(event) => setPlace(event.target.value)} maxLength={120} />}
        </Field>

        <Field id="turno-coordinator" label="Coordenação" error={errors.coordinator} required>
          {(control) => <TextInput {...control} value={coordinator} onChange={(event) => setCoordinator(event.target.value)} maxLength={128} />}
        </Field>
      </FieldRow>

      <div className="grid gap-5 sm:grid-cols-4">
        <Field id="turno-date" label="Dia" error={errors.date} required>
          {(control) => <TextInput {...control} type="date" value={date} onChange={(event) => setDate(event.target.value)} />}
        </Field>
        <Field id="turno-from" label="Início" error={errors.from} required>
          {(control) => <TextInput {...control} type="time" value={from} onChange={(event) => setFrom(event.target.value)} />}
        </Field>
        <Field id="turno-to" label="Fim" error={errors.to} required>
          {(control) => <TextInput {...control} type="time" value={to} onChange={(event) => setTo(event.target.value)} />}
        </Field>
        <Field id="turno-slots" label="Vagas" error={errors.slots} required>
          {(control) => <TextInput {...control} type="number" min={1} max={200} value={slots} onChange={(event) => setSlots(event.target.value)} />}
        </Field>
      </div>

      <Field id="turno-description" label="O que a pessoa vai fazer" hint="Aparece no cartão do turno, no painel do voluntário.">
        {(control) => <TextArea {...control} rows={2} value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} />}
      </Field>
    </EditorPanel>
  )
}
