import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { useRef } from "react"
import type { ReactNode } from "react"
import { useMediaQuery } from "../../hooks/use-media-query"
import { useMotionCapability } from "../../hooks/use-motion-capability"
import { cn } from "../../utils/cn"
import { BrandCanvas } from "../motion/brand-canvas"
import type { SceneVariant } from "../motion/brand-scene"
import { Container } from "../ui/container"
import { Breadcrumbs } from "./breadcrumbs"

type PageHeroTone = "institutional" | "primary" | "partner" | "success"

type PageHeroProps = {
  eyebrow: string
  title: string
  lead?: ReactNode
  breadcrumb: { label: string; to?: string }[]
  tone?: PageHeroTone
  action?: ReactNode
  /** Cena 3D do banner. Só entra em aparelho capaz, mas em qualquer largura. */
  scene?: SceneVariant
  children?: ReactNode
}

// Cabeçalho padrão de toda página interna. A repetição é o ponto: onze páginas
// diferentes com a mesma estrutura de topo é o que faz o conjunto parecer um
// documento só, em vez de onze páginas feitas em dias diferentes.
//
// A cascata de entrada mora aqui, e não em cada página, para que abrir qualquer
// tela interna tenha exatamente o mesmo ritmo, que é o que "motion-first" quer
// dizer na prática: o movimento é parte do sistema, não enfeite por tela.
const GRADIENT: Record<PageHeroTone, string> = {
  institutional: "bg-[radial-gradient(52%_120%_at_88%_0%,rgba(0,222,206,0.20),transparent_62%)]",
  primary: "bg-[radial-gradient(52%_120%_at_88%_0%,rgba(205,66,68,0.16),transparent_62%)]",
  partner: "bg-[radial-gradient(52%_120%_at_88%_0%,rgba(187,45,215,0.16),transparent_62%)]",
  success: "bg-[radial-gradient(52%_120%_at_88%_0%,rgba(118,187,86,0.20),transparent_62%)]",
}

// A cena fica na metade direita, longe do texto. A exceção é a procissão do
// Painel de Impacto: gente atravessando só faz sentido se atravessar o banner
// inteiro, então ali a cena ocupa toda a largura e é apagada por uma máscara
// justamente onde o título está.
const WIDE_SCENE = "pointer-events-none absolute inset-y-0 right-0 -z-10 w-[52%] opacity-70"

const WIDE_SCENE_BY_VARIANT: Partial<Record<SceneVariant, string>> = {
  care: [
    "pointer-events-none absolute inset-y-0 right-0 -z-10 w-[62%] opacity-85",
    "[-webkit-mask-image:linear-gradient(to_right,transparent_0%,#000_30%)]",
    "[mask-image:linear-gradient(to_right,transparent_0%,#000_30%)]",
  ].join(" "),
}

const EYEBROW: Record<PageHeroTone, string> = {
  institutional: "text-institutional-dark",
  primary: "text-primary",
  partner: "text-partner-dark",
  success: "text-success-dark",
}

export function PageHero({
  eyebrow,
  title,
  lead,
  breadcrumb,
  tone = "institutional",
  action,
  scene,
  children,
}: PageHeroProps) {
  const capability = useMotionCapability()
  // Em tela estreita a cena não pode ficar atrás do texto: vira uma tira
  // própria no fim do banner, com espaço reservado, em vez de disputar
  // contraste com o título.
  const wide = useMediaQuery("(min-width: 640px)")
  const rootRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (capability === "none") return

      const items = gsap.utils.toArray<HTMLElement>(".page-hero-in")

      // O `set` acontece antes da primeira pintura (useGSAP roda em layout
      // effect), então não existe piscada, e com o JavaScript quebrado o
      // cabeçalho aparece inteiro e parado.
      gsap.set(items, { opacity: 0, y: 18 })

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .to(items, { opacity: 1, y: 0, duration: 0.6, stagger: 0.07 })
        .from(".page-hero-title", { yPercent: 105, duration: 0.65 }, 0.05)
    },
    { scope: rootRef, dependencies: [capability] },
  )

  return (
    <section ref={rootRef} className="relative isolate overflow-hidden border-b border-line bg-surface-muted">
      <div aria-hidden="true" data-decorativo className={cn("absolute inset-0 -z-10", GRADIENT[tone])} />

      {scene && wide && (
        <BrandCanvas
          variant={scene}
          minWidth={640}
          className={WIDE_SCENE_BY_VARIANT[scene] ?? WIDE_SCENE}
        />
      )}

      <Container className="py-10 sm:py-14">
        <div className="page-hero-in">
          <Breadcrumbs items={breadcrumb} />
        </div>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p
              className={cn(
                "page-hero-in font-display text-sm font-bold tracking-[0.18em] uppercase",
                EYEBROW[tone],
              )}
            >
              {eyebrow}
            </p>

            <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">
              <span className="inline-flex overflow-hidden py-1">
                <span className="page-hero-title">{title}</span>
              </span>
            </h1>

            {lead && <div className="page-hero-in mt-4 text-base leading-relaxed text-ink-soft sm:text-lg">{lead}</div>}
          </div>

          {action && <div className="page-hero-in shrink-0">{action}</div>}
        </div>

        {children && <div className="page-hero-in">{children}</div>}

        {scene && !wide && (
          <BrandCanvas
            variant={scene}
            minWidth={320}
            className="pointer-events-none mt-8 h-24 w-full opacity-90"
          />
        )}
      </Container>
    </section>
  )
}
