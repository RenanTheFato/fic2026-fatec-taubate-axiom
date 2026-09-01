import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { useRef } from "react"
import { useInView } from "../../hooks/use-in-view"
import { useMotionCapability } from "../../hooks/use-motion-capability"
import { formatNumber } from "../../utils/format"

type CountUpProps = {
  value: number
  className?: string
  duration?: number
}

// O número final já está no HTML. A contagem é enfeite: se não rodar, o dado
// certo continua na tela — e é isso que o leitor de tela anuncia de qualquer forma.
export function CountUp({ value, className, duration = 1.6 }: CountUpProps) {
  const capability = useMotionCapability()
  const { ref, inView } = useInView<HTMLSpanElement>()
  const counter = useRef({ current: 0 })

  useGSAP(
    () => {
      const element = ref.current
      if (!element || capability === "none" || !inView) return

      counter.current.current = 0

      gsap.to(counter.current, {
        current: value,
        duration,
        ease: "power2.out",
        onUpdate: () => {
          element.textContent = formatNumber(Math.round(counter.current.current))
        },
        onComplete: () => {
          element.textContent = formatNumber(value)
        },
      })
    },
    { dependencies: [capability, inView, value, duration] },
  )

  return (
    <span ref={ref} className={className}>
      {formatNumber(value)}
    </span>
  )
}
