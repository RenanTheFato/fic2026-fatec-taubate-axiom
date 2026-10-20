import { useRef, useState } from "react"
import { flushSync } from "react-dom"
import type { FormEvent } from "react"
import { CheckoutError } from "../../config/errors"
import { useSavePost } from "../../hooks/use-admin-posts"
import type { PostInput } from "../../services/admin/posts-service"
import type { AdminPost, NewsCategory } from "../../types/news-types"
import { CATEGORY_LABEL } from "../news/news-labels"
import { Field, SelectInput, TextArea, TextInput } from "../ui/field"
import { EditorPanel } from "./editor-panel"
import { PhotoField } from "./photo-field"

type PostEditorProps = {
  /** Ausente: escrever uma notícia nova. Presente: editar esta. */
  post?: AdminPost
  onDone: (message: string) => void
  onCancel: () => void
}

type Errors = Partial<Record<keyof PostInput, string>>

const CATEGORIES: NewsCategory[] = ["eventos", "educacao", "inclusao", "saude"]

// As mesmas regras do backend, conferidas antes de enviar. O backend continua
// sendo a autoridade: o que passa daqui e é recusado lá aparece com a mensagem
// dele, logo acima do botão.
function validate(input: PostInput): Errors {
  const found: Errors = {}

  if (input.title.trim().length < 4) found.title = "Escreva um título com pelo menos 4 letras."
  if (input.excerpt.trim().length < 10) found.excerpt = "O resumo precisa de pelo menos 10 caracteres."
  if (input.body.trim().length < 20) found.body = "O texto precisa de pelo menos 20 caracteres."

  return found
}

// Escrever e editar notícia. Nasce rascunho: pôr no ar é a ação "Publicar" da
// lista, separada de propósito, para que salvar um texto pela metade nunca o
// publique por engano.
export function PostEditor({ post, onDone, onCancel }: PostEditorProps) {
  const [title, setTitle] = useState(post?.title ?? "")
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "")
  const [body, setBody] = useState(post?.body ?? "")
  const [category, setCategory] = useState<NewsCategory>(post?.category ?? "eventos")
  const [image, setImage] = useState<string | null>(post?.image_url ?? null)
  const [errors, setErrors] = useState<Errors>({})

  const formRef = useRef<HTMLFormElement>(null)
  const save = useSavePost()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const input: PostInput = {
      title: title.trim(),
      excerpt: excerpt.trim(),
      body: body.trim(),
      category,
      image_url: image,
    }

    const found = validate(input)

    // A mensagem de erro precisa existir no DOM antes de o foco chegar ao
    // campo, senão o leitor de tela anuncia o campo sem dizer o que falta.
    flushSync(() => setErrors(found))

    const first = Object.keys(found)[0]

    if (first) {
      formRef.current?.querySelector<HTMLElement>(`#noticia-${first}`)?.focus()
      return
    }

    const saved = await save.mutateAsync({ ...input, id: post?.id }).catch(() => null)

    if (saved) {
      onDone(post ? `"${saved.title}" foi atualizada.` : `"${saved.title}" foi salva como rascunho. Publique quando estiver pronta.`)
    }
  }

  return (
    <EditorPanel
      id="editor-noticia"
      title={post ? "Editar notícia" : "Escrever notícia"}
      formRef={formRef}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      saving={save.isPending}
      submitLabel={post ? "Salvar alterações" : "Salvar rascunho"}
      error={
        save.isError
          ? save.error instanceof CheckoutError
            ? save.error.message
            : "Não conseguimos falar com o servidor. O texto continua aqui, é só tentar de novo."
          : null
      }
    >
      <Field id="noticia-title" label="Título" error={errors.title} required>
        {(control) => <TextInput {...control} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} />}
      </Field>

      <Field id="noticia-category" label="Assunto" hint="Vira a aba de filtro na página de notícias." required>
        {(control) => (
          <SelectInput {...control} value={category} onChange={(event) => setCategory(event.target.value as NewsCategory)}>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {CATEGORY_LABEL[item].label}
              </option>
            ))}
          </SelectInput>
        )}
      </Field>

      <PhotoField id="noticia-foto" value={image} onChange={setImage} ratio="16/9" hint="Foto que abre a notícia" />

      <Field id="noticia-excerpt" label="Resumo" hint="Uma ou duas frases. Aparece no card da home e na lista." error={errors.excerpt} required>
        {(control) => (
          <TextArea {...control} rows={2} value={excerpt} onChange={(event) => setExcerpt(event.target.value)} maxLength={320} />
        )}
      </Field>

      <Field
        id="noticia-body"
        label="Texto"
        hint="Deixe uma linha em branco entre um parágrafo e outro."
        error={errors.body}
        required
      >
        {(control) => <TextArea {...control} rows={10} value={body} onChange={(event) => setBody(event.target.value)} />}
      </Field>
    </EditorPanel>
  )
}
