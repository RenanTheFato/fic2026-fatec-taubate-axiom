import { BookOpenText } from "lucide-react"
import { useReadingMode } from "../../hooks/use-reading-mode"
import { cn } from "../../utils/cn"

type ReadingModeToggleProps = {
  className?: string
  tone?: "light" | "ink"
  /** Versão baixa para a barra utilitária, que é só de desktop e ponteiro fino. */
  compact?: boolean
}

export function ReadingModeToggle({ className, tone = "light", compact }: ReadingModeToggleProps) {
  const { easyReading, toggle } = useReadingMode()

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={easyReading}
      className={cn(
        "inline-flex items-center gap-2 rounded-pill px-3 font-display font-bold whitespace-nowrap transition-colors",
        compact ? "min-h-8 text-[0.8125rem]" : "min-h-11 text-sm",
        tone === "light"
          ? "text-white hover:text-reward aria-pressed:bg-reward aria-pressed:text-ink"
          : "border-2 border-line text-ink hover:border-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white",
        className,
      )}
    >
      <BookOpenText className="size-4" aria-hidden="true" />
      Leitura fácil
      <span className="sr-only">{easyReading ? "(ativada)" : "(desativada)"}</span>
    </button>
  )
}
