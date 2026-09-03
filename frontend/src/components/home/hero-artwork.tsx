import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { GraduationCap, HandHeart, Stethoscope } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useRef } from "react"
import { useInView } from "../../hooks/use-in-view"
import { useMotionCapability } from "../../hooks/use-motion-capability"
import { ImageSlot } from "../ui/image-slot"

type Chip = {
  icon: LucideIcon
  label: string
  value: string
  tone: string
  position: string
}

// As três frentes de atendimento flutuam sobre a foto. São dados reais da ONG,
const CHIPS: Chip[] = [
  {
    icon: Stethoscope,
    label: "Ambulatório",
    value: "924 usuários",
    tone: "text-institutional-dark",
    position: "-left-3 top-8 sm:-left-6",
  },
  {
    icon: GraduationCap,
    label: "Escola",
    value: "169 alunos",
    tone: "text-primary",
    position: "-right-3 top-1/2 sm:-right-6",
  },
  {
    icon: HandHeart,
    label: "Oficina",
    value: "145 usuários",
    tone: "text-partner-dark",
    position: "-left-3 bottom-8 sm:-left-6",
  },
]

export function HeroArtwork() {
  const capability = useMotionCapability()
  const { ref, inView } = useInView<HTMLDivElement>({ once: false })
  const frameRef = useRef<HTMLDivElement>(null)

  // Flutuação contínua dos selos. Roda só com a seção na tela: animação infinita
  // fora de vista é o desperdício mais fácil de cometer com o GSAP.
  useGSAP(
    () => {
      if (capability !== "full" || !inView) return

      gsap.to(".hero-chip", {
        y: -9,
        duration: 2.6,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: { each: 0.4, from: "random" },
      })
    },
    { scope: ref, dependencies: [capability, inView] },
  )

  // Inclinação seguindo o ponteiro. `quickTo` reaproveita o mesmo tween em vez
  // de criar um por evento, e só existe em ponteiro fino, porque no toque o dedo
  // cobre justamente o que a inclinação mostraria.
  useGSAP(
    () => {
      const frame = frameRef.current
      if (!frame || capability !== "full") return
      if (!window.matchMedia("(pointer: fine)").matches) return

      gsap.set(frame, { transformPerspective: 900, transformOrigin: "center" })

      const rotateX = gsap.quickTo(frame, "rotationX", { duration: 0.7, ease: "power3" })
      const rotateY = gsap.quickTo(frame, "rotationY", { duration: 0.7, ease: "power3" })

      function onMove(event: PointerEvent) {
        const bounds = frame!.getBoundingClientRect()
        const x = (event.clientX - bounds.left) / bounds.width - 0.5
        const y = (event.clientY - bounds.top) / bounds.height - 0.5

        rotateY(x * 9)
        rotateX(y * -7)
      }

      function reset() {
        rotateX(0)
        rotateY(0)
      }

      frame.addEventListener("pointermove", onMove)
      frame.addEventListener("pointerleave", reset)

      return () => {
        frame.removeEventListener("pointermove", onMove)
        frame.removeEventListener("pointerleave", reset)
      }
    },
    { dependencies: [capability] },
  )

  return (
    <div ref={ref} className="relative">
      <div ref={frameRef} className="overflow-hidden rounded-card border border-line bg-surface shadow-xl">
        <ImageSlot
          src="/imagens/home-hero.jpg"
          eager
          ratio="4/3"
          alt="Atendimento na Somos do Bem"
          hint="Foto horizontal de um atendimento ou de uma turma da escola, com pessoas em primeiro plano"
        />
      </div>

      <ul>
        {CHIPS.map((chip) => (
          <li
            key={chip.label}
            className={`hero-chip absolute flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-3 shadow-lg ${chip.position}`}
          >
            <chip.icon className={`size-5 shrink-0 ${chip.tone}`} aria-hidden="true" />
            <span className="text-left">
              <strong className="block font-display text-sm leading-tight font-extrabold">{chip.value}</strong>
              <span className="text-xs text-ink-soft">{chip.label}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
