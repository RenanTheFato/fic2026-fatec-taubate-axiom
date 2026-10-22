import { useRef, useState } from "react"
import { flushSync } from "react-dom"
import type { FormEvent } from "react"
import { CheckoutError } from "../../config/errors"
import { useSaveSocialPost } from "../../hooks/use-admin-social"
import type { AdminSocialPost, SocialNetwork } from "../../types/social-types"
import { fromDateInput, toDateInput } from "../../utils/form-input"
import { NETWORK_ORDER, NETWORKS } from "../social/social-labels"
import { Field, FieldRow, SelectInput, TextArea, TextInput } from "../ui/field"
import { EditorPanel } from "./editor-panel"
import { PhotoField } from "./photo-field"

type SocialPostEditorProps = {
  /** Ausente: trazer uma publicação nova. Presente: editar esta. */
  post?: AdminSocialPost
  onDone: (message: string) => void
  onCancel: () => void
}

type Errors = Partial<Record<"url" | "caption" | "published_at" | "image", string>>

const HOSTS: Record<SocialNetwork, RegExp> = {
  instagram: /^https:\/\/(www\.)?instagram\.com\//i,
  facebook: /^https:\/\/((www|m)\.)?facebook\.com\/|^https:\/\/fb\.watch\//i,
  youtube: /^https:\/\/((www|m)\.)?youtube\.com\/|^https:\/\/youtu\.be\//i,
}

// Trazer para o site uma publicação feita nas redes. Instagram e Facebook pedem
// a foto, que é o que o site mostra; o vídeo do YouTube dispensa, porque a capa
// e o player vêm do próprio YouTube.
export function SocialPostEditor({ post, onDone, onCancel }: SocialPostEditorProps) {
  const [network, setNetwork] = useState<SocialNetwork>(post?.network ?? "instagram")
  const [url, setUrl] = useState(post?.url ?? "")
  const [caption, setCaption] = useState(post?.caption ?? "")
  const [date, setDate] = useState(toDateInput(post?.published_at ?? new Date().toISOString()))
  const [image, setImage] = useState<string | null>(post?.network === "youtube" ? null : (post?.image_url ?? null))
  const [errors, setErrors] = useState<Errors>({})

  const formRef = useRef<HTMLFormElement>(null)
  const save = useSaveSocialPost()
  const video = network === "youtube"

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const publishedAt = fromDateInput(date)
    const found: Errors = {}

    if (!HOSTS[network].test(url.trim())) found.url = `Cole o endereço da publicação no ${NETWORKS[network].label}, começando com https://.`
    if (caption.trim().length < 3) found.caption = "Escreva o texto da publicação."
    if (!publishedAt) found.published_at = "Escolha a data em que a publicação saiu."
    else if (new Date(publishedAt).getTime() > Date.now()) found.published_at = "A data não pode estar no futuro."
    if (!video && !image) found.image = "Envie a foto da publicação."

    flushSync(() => setErrors(found))

    const first = Object.keys(found)[0]

    if (first || !publishedAt) {
      formRef.current?.querySelector<HTMLElement>(`#rede-${first}`)?.focus()
      return
    }

    const saved = await save
      .mutateAsync({
        id: post?.id,
        network,
        url: url.trim(),
        caption: caption.trim(),
        image_url: video ? null : image,
        published_at: publishedAt,
      })
      .then(() => true)
      .catch(() => false)

    if (saved) onDone(post ? "A publicação foi atualizada." : "A publicação já aparece na página de redes sociais.")
  }

  return (
    <EditorPanel
      id="editor-rede"
      title={post ? "Editar publicação" : "Nova publicação"}
      formRef={formRef}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      saving={save.isPending}
      submitLabel={post ? "Salvar alterações" : "Publicar no site"}
      error={
        save.isError
          ? save.error instanceof CheckoutError
            ? save.error.message
            : "Não conseguimos falar com o servidor. O texto continua aqui, é só tentar de novo."
          : null
      }
    >
      <FieldRow>
        <Field id="rede-network" label="Rede" required>
          {(control) => (
            <SelectInput {...control} value={network} onChange={(event) => setNetwork(event.target.value as SocialNetwork)}>
              {NETWORK_ORDER.map((item) => (
                <option key={item} value={item}>
                  {NETWORKS[item].label}
                </option>
              ))}
            </SelectInput>
          )}
        </Field>

        <Field id="rede-published_at" label="Publicada em" error={errors.published_at} required>
          {(control) => <TextInput {...control} type="date" value={date} onChange={(event) => setDate(event.target.value)} />}
        </Field>
      </FieldRow>

      <Field
        id="rede-url"
        label="Endereço da publicação"
        hint={video ? "O endereço do vídeo, como https://youtu.be/... ou https://www.youtube.com/watch?v=..." : "Em Compartilhar, copie o link da publicação."}
        error={errors.url}
        required
      >
        {(control) => <TextInput {...control} type="url" value={url} onChange={(event) => setUrl(event.target.value)} maxLength={500} placeholder="https://" />}
      </Field>

      {!video && (
        <div className="grid gap-2">
          <PhotoField id="rede-image" value={image} onChange={setImage} ratio="1/1" hint="A foto da publicação" />
          {errors.image && <p className="text-sm font-semibold text-primary">{errors.image}</p>}
        </div>
      )}

      <Field id="rede-caption" label="Texto" hint="A legenda como saiu na rede." error={errors.caption} required>
        {(control) => <TextArea {...control} rows={5} value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={2200} />}
      </Field>
    </EditorPanel>
  )
}
