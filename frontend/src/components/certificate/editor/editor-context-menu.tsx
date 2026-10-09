import { useEffect, useLayoutEffect, useRef, useState } from "react"
import type { KeyboardEvent } from "react"
import { cn } from "../../../utils/cn"

export type MenuItem =
  | { label: string; shortcut?: string; onSelect: () => void; disabled?: boolean; danger?: boolean }
  | "separator"

type EditorContextMenuProps = {
  position: { x: number; y: number }
  items: MenuItem[]
  onClose: () => void
}

// O menu do botão direito, como em qualquer editor de slides. Abre no ponteiro,
// sem passar da borda da tela, e se navega pelas setas; Esc ou um clique fora
// fecham.
export function EditorContextMenu({ position, items, onClose }: EditorContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [place, setPlace] = useState(position)

  useLayoutEffect(() => {
    const menu = ref.current

    if (!menu) return

    const { width, height } = menu.getBoundingClientRect()
    setPlace({
      x: Math.min(position.x, window.innerWidth - width - 8),
      y: Math.min(position.y, window.innerHeight - height - 8),
    })
    menu.querySelector<HTMLButtonElement>("[role='menuitem']:not(:disabled)")?.focus()
  }, [position])

  useEffect(() => {
    function onPointer(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) onClose()
    }

    document.addEventListener("pointerdown", onPointer)
    window.addEventListener("blur", onClose)
    window.addEventListener("resize", onClose)

    return () => {
      document.removeEventListener("pointerdown", onPointer)
      window.removeEventListener("blur", onClose)
      window.removeEventListener("resize", onClose)
    }
  }, [onClose])

  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    event.stopPropagation()

    if (event.key === "Escape" || event.key === "Tab") {
      event.preventDefault()
      onClose()
      return
    }

    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return

    event.preventDefault()
    const enabled = [...(ref.current?.querySelectorAll<HTMLButtonElement>("[role='menuitem']:not(:disabled)") ?? [])]
    const index = enabled.indexOf(document.activeElement as HTMLButtonElement)
    enabled[(index + (event.key === "ArrowDown" ? 1 : -1) + enabled.length) % enabled.length]?.focus()
  }

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Ações do elemento"
      onKeyDown={onKey}
      onContextMenu={(event) => event.preventDefault()}
      className="fixed z-50 min-w-56 rounded-card border border-line bg-surface p-1 shadow-xl"
      style={{ left: place.x, top: place.y }}
    >
      {items.map((item, index) =>
        item === "separator" ? (
          <div key={`separador-${index}`} role="separator" className="my-1 h-px bg-line" />
        ) : (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              item.onSelect()
              onClose()
            }}
            className={cn(
              "flex w-full items-center justify-between gap-6 rounded-tile px-3 py-1.5 text-left text-sm outline-none",
              "hover:bg-surface-muted focus-visible:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40",
              item.danger && "text-primary",
            )}
          >
            {item.label}
            {item.shortcut && <span className="text-xs text-ink-soft">{item.shortcut}</span>}
          </button>
        ),
      )}
    </div>
  )
}
