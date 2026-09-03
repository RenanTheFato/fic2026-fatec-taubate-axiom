import { ChevronDown } from "lucide-react"
import { useState } from "react"
import type { FaqItem } from "../../types/institutional-types"
import { cn } from "../../utils/cn"

type FaqAccordionProps = {
  items: FaqItem[]
}

// Sanfona própria, com a ligação de ARIA feita à mão: `aria-expanded` no botão,
// `aria-controls` apontando para o painel e o painel apontando de volta com
// `aria-labelledby`. Abrir e fechar não anima altura, porque animar altura recalcula
// layout, e a regra do projeto é mexer só em transform e opacidade.
export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null)

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const open = openId === item.id
        const buttonId = `pergunta-${item.id}`
        const panelId = `resposta-${item.id}`

        return (
          <li key={item.id} className="overflow-hidden rounded-card border border-line bg-surface">
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenId(open ? null : item.id)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-display text-base font-bold text-ink hover:bg-surface-muted sm:text-lg"
              >
                {item.question}
                <ChevronDown
                  className={cn("size-5 shrink-0 text-ink-soft transition-transform", open && "rotate-180")}
                  aria-hidden="true"
                />
              </button>
            </h3>

            <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!open}>
              <p className="border-t border-line px-5 py-4 text-base leading-relaxed text-ink-soft">
                {item.answer}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
