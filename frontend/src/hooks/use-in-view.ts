import { useEffect, useRef, useState } from "react"

type Options = {
  once?: boolean
  rootMargin?: string
  threshold?: number
}

// IntersectionObserver em vez de tween preso ao scroll: animação ligada ao
// scroll recalcula layout a cada quadro de cada rolagem, que é exatamente o
// custo que um aparelho fraco não paga.
export function useInView<T extends HTMLElement>(options: Options = {}) {
  const { once = true, rootMargin = "0px 0px -12% 0px", threshold = 0.15 } = options
  const ref = useRef<T>(null)
  // Sem IntersectionObserver (navegador antigo, ambiente de teste) tudo já nasce
  // visível: a melhoria some, o conteúdo não.
  const [inView, setInView] = useState(() => typeof IntersectionObserver === "undefined")

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (typeof IntersectionObserver === "undefined") return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (once) observer.disconnect()
          return
        }

        if (!once) setInView(false)
      },
      { rootMargin, threshold },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [once, rootMargin, threshold])

  return { ref, inView }
}
