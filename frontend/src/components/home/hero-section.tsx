import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { HandHeart, Heart, MapPin, ShieldCheck } from "lucide-react"
import { useRef } from "react"
import { useMotionCapability } from "../../hooks/use-motion-capability"
import { BrandCanvas } from "../motion/brand-canvas"
import { ButtonLink } from "../ui/button"
import { Container } from "../ui/container"
import { HeroArtwork } from "./hero-artwork"

export function HeroSection() {
  const capability = useMotionCapability()
  const rootRef = useRef<HTMLDivElement>(null)

  // Entrada em cascata: a única animação do site que roda sem o usuário pedir.
  useGSAP(
    () => {
      if (capability === "none") return

      const items = gsap.utils.toArray<HTMLElement>(".hero-in")

      gsap.set(items, { autoAlpha: 0, y: 22 })

      gsap.timeline({ defaults: { ease: "power3.out" } })
        .to(items, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08 })
        .from(".hero-word", { yPercent: 110, duration: 0.7, stagger: 0.1 }, 0.1)
    },
    { scope: rootRef, dependencies: [capability] },
  )

  return (
    <section ref={rootRef} className="relative isolate overflow-hidden bg-surface-muted">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(58%_68%_at_82%_16%,rgba(0,222,206,0.20),transparent_62%),radial-gradient(46%_58%_at_8%_2%,rgba(187,45,215,0.12),transparent_66%)]"
      />

      <BrandCanvas
        variant="network"
        className="pointer-events-none absolute top-0 right-0 -z-10 h-full w-[46%] opacity-70"
      />

      <Container className="grid items-center gap-14 py-16 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:py-28">
        <div>
          <p className="hero-in inline-flex items-center gap-2 rounded-pill bg-surface px-4 py-2 font-display text-sm font-bold text-primary shadow-sm">
            <MapPin className="size-4" aria-hidden="true" />
            Indaiatuba, São Paulo
          </p>

          <h1 className="mt-6 font-display text-5xl leading-[1.05] font-extrabold sm:text-6xl lg:text-7xl">
            <span className="inline-flex overflow-hidden py-1 align-bottom">
              <span className="hero-word">Somos</span>
            </span>{" "}
            <span className="inline-flex overflow-hidden py-1 align-bottom text-primary">
              <span className="hero-word">do Bem</span>
            </span>
          </h1>

          <p className="hero-in mt-5 max-w-xl font-display text-xl leading-snug font-bold text-ink sm:text-2xl">
            Associação beneficente para pessoas com Deficiência Intelectual
          </p>

          <p className="hero-in mt-4 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
            Seja bem-vindo(a) a essa rede que constrói inclusão, saúde e apoio a pessoas com
            Deficiência Intelectual e/ou Múltipla de causa neurológica e Transtornos Invasivos do
            Desenvolvimento — e às suas famílias.
          </p>

          <div className="hero-in mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink to="/doe-agora" size="lg">
              <Heart className="size-5" aria-hidden="true" />
              Quero doar
            </ButtonLink>

            <ButtonLink to="/seja-voluntario" size="lg" tone="success" variant="outline">
              <HandHeart className="size-5" aria-hidden="true" />
              Seja voluntário
            </ButtonLink>
          </div>

          <p className="hero-in mt-6 flex items-center gap-2 text-sm text-ink-soft">
            <ShieldCheck className="size-4 text-institutional-dark" aria-hidden="true" />
            Recibo com verificação pública de autenticidade em cada doação
          </p>
        </div>

        <div className="hero-in">
          <HeroArtwork />
        </div>
      </Container>
    </section>
  )
}
