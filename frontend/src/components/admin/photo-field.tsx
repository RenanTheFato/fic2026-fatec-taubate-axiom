import { ImagePlus, Loader2, Trash2 } from "lucide-react"
import type { ChangeEvent } from "react"
import { CheckoutError } from "../../config/errors"
import { useUploadPhoto } from "../../hooks/use-catalog-editor"
import { ImageSlot } from "../ui/image-slot"
import type { ImageRatio } from "../ui/image-slot"

type PhotoFieldProps = {
  id: string
  /** Endereço atual: caminho do site, endereço https ou foto enviada pelo painel. */
  value: string | null
  onChange: (url: string | null) => void
  /** O que a foto precisa mostrar. Aparece no espaço reservado enquanto não há foto. */
  hint: string
  /** A mesma proporção do cartão onde a foto aparece no site. */
  ratio: ImageRatio
}

// A troca de foto do cadastro. A prévia usa a mesma proporção do cartão do site,
// então a equipe vê o recorte que o visitante vai ver antes de salvar. Enviar
// grava a foto no servidor e devolve o endereço; o cadastro só passa a usá-lo
// quando o formulário é salvo, e "Cancelar" deixa a foto antiga onde estava.
export function PhotoField({ id, value, onChange, hint, ratio }: PhotoFieldProps) {
  const upload = useUploadPhoto()

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    // O mesmo arquivo escolhido duas vezes seguidas precisa disparar de novo.
    event.target.value = ""

    if (!file) return

    upload.mutate(file, { onSuccess: (photo) => onChange(photo.url) })
  }

  const errorId = upload.isError ? `${id}-erro` : undefined

  return (
    <fieldset className="grid content-start gap-3">
      <legend className="font-display text-sm font-bold text-ink">
        Foto de capa
        <span className="ml-2 font-sans text-xs font-normal text-ink-soft">(opcional)</span>
      </legend>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,16rem)_1fr] sm:items-start">
        <div className="overflow-hidden rounded-tile border border-line">
          <ImageSlot src={value} ratio={ratio} alt="Prévia da foto de capa" hint={hint} />
        </div>

        <div className="flex flex-col items-start gap-3">
          <p className="text-xs text-ink-soft">JPEG ou PNG. Foto grande é reduzida antes do envio.</p>

          <div className="flex flex-wrap gap-2">
            {/* O controle de arquivo é o nativo, escondido só da vista: o rótulo
                faz o papel de botão e o teclado chega nele pelo próprio input. */}
            <label
              htmlFor={id}
              className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-pill border-2 border-ink px-4 py-1.5 font-display text-sm font-bold text-ink transition-colors hover:bg-surface-muted has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-[3px] has-[:focus-visible]:outline-ink"
            >
              {upload.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ImagePlus className="size-4" aria-hidden="true" />}
              {upload.isPending ? "Enviando…" : value ? "Trocar foto" : "Enviar foto"}
              <input
                id={id}
                type="file"
                accept="image/jpeg,image/png"
                className="sr-only"
                disabled={upload.isPending}
                aria-describedby={errorId}
                onChange={onFile}
              />
            </label>

            {value && !upload.isPending && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="inline-flex min-h-9 items-center justify-center gap-2 rounded-pill border-2 border-primary px-4 py-1.5 font-display text-sm font-bold text-primary transition-colors hover:bg-primary-soft"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Remover foto
              </button>
            )}
          </div>

          {upload.isError && (
            <p id={errorId} className="text-sm font-semibold text-primary">
              {upload.error instanceof CheckoutError ? upload.error.message : "Não conseguimos enviar a foto agora. Tente de novo."}
            </p>
          )}
        </div>
      </div>
    </fieldset>
  )
}
