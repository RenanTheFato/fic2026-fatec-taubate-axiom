import { ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"

type Crumb = {
  label: string
  to?: string
}

type BreadcrumbsProps = {
  items: Crumb[]
}

// Toda página interna diz onde está. Em site institucional isso não é enfeite:
// muita gente chega por link direto ou por busca, sem passar pela home.
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Você está em">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-ink-soft">
        <li className="flex items-center gap-1">
          <Link to="/" className="hover:text-primary">
            Home
          </Link>
          <ChevronRight className="size-4" aria-hidden="true" />
        </li>

        {items.map((item, index) => {
          const last = index === items.length - 1

          return (
            <li key={item.label} className="flex items-center gap-1">
              {item.to && !last ? (
                <Link to={item.to} className="hover:text-primary">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={last ? "font-semibold text-ink" : undefined}>
                  {item.label}
                </span>
              )}
              {!last && <ChevronRight className="size-4" aria-hidden="true" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
