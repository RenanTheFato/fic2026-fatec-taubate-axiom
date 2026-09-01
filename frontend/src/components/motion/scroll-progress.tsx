import { useEffect, useRef } from "react"
import { useMotionCapability } from "../../hooks/use-motion-capability"

// Barra de progresso de leitura no topo. Só escuta o scroll (passivo) e escreve
// um scaleX: nenhum cálculo de layout por quadro. É a única coisa animada que
// acompanha a rolagem no projeto inteiro, justamente por custar isso.
export function ScrollProgress() {
  const capability = useMotionCapability()
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (capability === "none") return

    const bar = barRef.current
    if (!bar) return

    let ticking = false

    function paint() {
      ticking = false
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0
      bar!.style.transform = `scaleX(${progress})`
    }

    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(paint)
    }

    paint()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [capability])

  if (capability === "none") return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1" aria-hidden="true">
      <div
        ref={barRef}
        className="h-full origin-left scale-x-0 bg-gradient-to-r from-institutional via-reward to-partner"
      />
    </div>
  )
}
