import { useEffect, useRef, useState } from "react"

// Popover: abre colado no botão, fecha no Esc, num clique fora ou quando o
// foco sai dele. O foco volta para o botão ao fechar com o teclado.
export function usePopover() {
  const [open, setOpen] = useState(false)
  const anchor = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function onPointer(event: PointerEvent) {
      const target = event.target as Node

      if (panel.current?.contains(target) || anchor.current?.contains(target)) return
      setOpen(false)
    }

    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return

      event.stopPropagation()
      setOpen(false)
      anchor.current?.focus()
    }

    document.addEventListener("pointerdown", onPointer)
    document.addEventListener("keydown", onKey, true)

    return () => {
      document.removeEventListener("pointerdown", onPointer)
      document.removeEventListener("keydown", onKey, true)
    }
  }, [open])

  return { open, setOpen, anchor, panel, toggle: () => setOpen((current) => !current) }
}
