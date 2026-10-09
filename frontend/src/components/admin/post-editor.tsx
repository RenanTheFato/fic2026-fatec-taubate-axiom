import { Loader2, Save, X } from "lucide-react"
import { useRef, useState } from "react"
import { flushSync } from "react-dom"
import type { FormEvent } from "react"
import { CheckoutError } from "../../config/errors"
import { useSavePost } from "../../hooks/use-admin-posts"
import type { PostInput } from "../../services/admin/posts-service"
import type { AdminPost, NewsCategory } from "../../types/news-types"
import { CATEGORY_LABEL } from "../news/news-labels"
import { Button } from "../ui/button"
import { Field, FieldRow, SelectInput, TextArea, TextInput } from "../ui/field"
import { StateMessage } from "../ui/states"

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
  if (input.image_url && !/^(\/\S*|https:\/\/\S+)$/.test(input.image_url)) {
    found.image_url = "Use um caminho do site, como /imagens/noticias/foto.jpg, ou um endereço https."
  }

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
  const [image, setImage] = useState(post?.image_url ?? "")
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
      image_url: image.trim().length > 0 ? image.trim() : null,
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
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby="editor-noticia"
      className="flex flex-col gap-5 rounded-card border border-line bg-surface p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="editor-noticia" className="font-display text-xl font-bold">
            {post ? "Editar notícia" : "Escrever notícia"}
          </h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-tile border border-line hover:bg-surface-muted"
        >
          <X className="size-5" aria-hidden="true" />
          <span className="sr-only">Fechar o editor</span>
        </button>
      </div>

      <Field id="noticia-title" label="Título" error={errors.title} required>
        {(control) => <TextInput {...control} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} />}
      </Field>

      <FieldRow>
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

        <Field
          id="noticia-image_url"
          label="Foto de capa"
          hint="Caminho de uma foto do site, como /imagens/noticias/foto.jpg."
          error={errors.image_url}
        >
          {(control) => <TextInput {...control} value={image} onChange={(event) => setImage(event.target.value)} />}
        </Field>
      </FieldRow>

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

      {save.isError && (
        <StateMessage
          tone="error"
          title="A notícia não foi salva"
          description={
            save.error instanceof CheckoutError
              ? save.error.message
              : "Não conseguimos falar com o servidor. O texto continua aqui, é só tentar de novo."
          }
        />
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="size-4" aria-hidden="true" />
          )}
          {post ? "Salvar alterações" : "Salvar rascunho"}
        </Button>
        <Button type="button" variant="outline" tone="ink" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
