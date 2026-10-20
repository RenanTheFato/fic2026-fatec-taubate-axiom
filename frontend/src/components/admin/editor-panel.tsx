import { Loader2, Save, X } from "lucide-react"
import { useEffect } from "react"
import type { FormEvent, ReactNode, RefObject } from "react"
import { Button } from "../ui/button"
import { StateMessage } from "../ui/states"

type EditorPanelProps = {
  /** Prefixo do id do título, que nomeia o formulário para o leitor de tela. */
  id: string
  title: string
  formRef: RefObject<HTMLFormElement | null>
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
  saving: boolean
  submitLabel: string
  /** O que o servidor recusou, já em frase. O texto digitado continua no formulário. */
  error: string | null
  children: ReactNode
}

// A moldura comum dos formulários de cadastro do painel: notícia, campanha,
// evento, produto e doador abrem no mesmo lugar, acima da lista, com o mesmo
// título, o mesmo botão de fechar e o mesmo rodapé. Quem aprende a editar uma
// coisa sabe editar todas.
export function EditorPanel({ id, title, formRef, onSubmit, onCancel, saving, submitLabel, error, children }: EditorPanelProps) {
  // O formulário abre acima da lista, e "Editar" pode ter sido clicado lá no
  // fim dela. O foco vai para o primeiro campo, o que também rola a tela até
  // ele: quem usa teclado ou leitor de tela começa a digitar onde precisa.
  useEffect(() => {
    formRef.current?.querySelector<HTMLElement>("input, textarea, select")?.focus()
  }, [formRef])

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      aria-labelledby={`${id}-titulo`}
      className="flex flex-col gap-5 rounded-card border border-line bg-surface p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id={`${id}-titulo`} className="font-display text-xl font-bold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-tile border border-line hover:bg-surface-muted"
        >
          <X className="size-5" aria-hidden="true" />
          <span className="sr-only">Fechar o formulário</span>
        </button>
      </div>

      {children}

      {error && <StateMessage tone="error" title="Não foi salvo" description={error} />}

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" tone="ink" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
