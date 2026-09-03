import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import type { ReactNode } from "react"
import { useInView } from "../../hooks/use-in-view"
import { useMotionCapability } from "../../hooks/use-motion-capability"
import { cn } from "../../utils/cn"

type RevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  from?: "bottom" | "left" | "right"
}

const OFFSET = {
  bottom: { y: 28, x: 0 },
  left: { y: 0, x: -32 },
  right: { y: 0, x: 32 },
}

// O conteúdo está visível no HTML. Só depois, e só se o aparelho puder pagar,
// ele é escondido e revelado. Com o JavaScript quebrado a página fica inteira.
//
// Sempre `opacity`, nunca `autoAlpha`: o `autoAlpha` do GSAP também escreve
// `visibility: hidden`, e isso tira o elemento da árvore de acessibilidade:
// leitor de tela e navegação por teclado deixam de enxergá-lo enquanto a
// animação não termina. Invisível é aceitável; inexistente não é.
export function Reveal({ children, className, delay = 0, from = "bottom" }: RevealProps) {
  const capability = useMotionCapability()
  const { ref, inView } = useInView<HTMLDivElement>()

  useGSAP(
    () => {
      const element = ref.current
      if (!element || capability === "none") return

      if (!inView) {
        gsap.set(element, { opacity: 0, ...OFFSET[from] })
        return
      }

      gsap.to(element, {
        opacity: 1,
        x: 0,
        y: 0,
        duration: 0.7,
        delay,
        ease: "power2.out",
        clearProps: "transform",
      })
    },
    { dependencies: [capability, inView, delay, from] },
  )

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  )
}
