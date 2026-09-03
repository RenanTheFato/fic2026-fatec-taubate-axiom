import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { Building2, HeartHandshake } from "lucide-react"
import { useRef } from "react"
import { usePartners } from "../../hooks/use-partners"
import { useInView } from "../../hooks/use-in-view"
import { useMotionCapability } from "../../hooks/use-motion-capability"
import type { Partner } from "../../types/partner-types"
import { ButtonLink } from "../ui/button"
import { Container } from "../ui/container"
import { SectionHeading } from "../ui/section"
import { Skeleton, StateMessage } from "../ui/states"

function PartnerCard({ partner }: { partner: Partner }) {
  return (
    <li className="flex h-24 w-44 shrink-0 items-center justify-center rounded-card border border-line bg-surface px-5 transition-colors hover:border-institutional">
      {partner.logo ? (
        <img src={partner.logo} alt={partner.name} loading="lazy" className="max-h-12 w-auto object-contain" />
      ) : (
        <span className="text-center font-display text-base leading-tight font-bold text-ink-soft">
          {partner.name}
        </span>
      )}
    </li>
  )
}

// A faixa rola sozinha, devagar, e para em três situações: ponteiro em cima,
// foco de teclado dentro dela e seção fora da tela. Sem essas três, um laço
// infinito vira consumo permanente de bateria por um enfeite.
function PartnerMarquee({ partners }: { partners: Partner[] }) {
  const capability = useMotionCapability()
  const { ref, inView } = useInView<HTMLDivElement>({ once: false, threshold: 0 })
  const trackRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const track = trackRef.current
      if (!track || capability === "none" || !inView) return

      const tween = gsap.to(track, {
        xPercent: -50,
        duration: partners.length * 3.4,
        ease: "none",
        repeat: -1,
      })

      const pause = () => tween.pause()
      const play = () => tween.play()

      track.addEventListener("pointerenter", pause)
      track.addEventListener("pointerleave", play)
      track.addEventListener("focusin", pause)
      track.addEventListener("focusout", play)

      return () => {
        track.removeEventListener("pointerenter", pause)
        track.removeEventListener("pointerleave", play)
        track.removeEventListener("focusin", pause)
        track.removeEventListener("focusout", play)
      }
    },
    { dependencies: [capability, inView, partners.length] },
  )

  // Sem movimento, a faixa vira uma grade normal: mesma informação, sem laço e
  // sem a segunda cópia da lista.
  if (capability === "none") {
    return (
      <ul className="mt-10 flex flex-wrap justify-center gap-4">
        {partners.map((partner) => (
          <PartnerCard key={partner.id} partner={partner} />
        ))}
      </ul>
    )
  }

  return (
    <div
      ref={ref}
      className="relative mt-10 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
    >
      <div ref={trackRef} className="flex w-max gap-4">
        <ul className="flex gap-4">
          {partners.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} />
          ))}
        </ul>

        {/* Segunda cópia só para o laço não ter emenda visível. O leitor de
            tela não deve ouvir a lista duas vezes. */}
        <ul className="flex gap-4" aria-hidden="true">
          {partners.map((partner) => (
            <PartnerCard key={`${partner.id}-eco`} partner={partner} />
          ))}
        </ul>
      </div>
    </div>
  )
}

export function PartnersSection() {
  const { data, isPending, isError, refetch } = usePartners()

  return (
    <section aria-labelledby="parceiros" className="border-y border-line bg-surface-muted py-16 sm:py-20">
      <Container>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            id="parceiros"
            eyebrow="Quem caminha com a gente"
            title="Nossos parceiros"
            description="Empresas de Indaiatuba e região sustentam o custo fixo do Ambulatório, da Escola e da Oficina. É o apoio recorrente delas que permite atender sem cobrar das famílias."
            tone="institutional"
          />

          <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center lg:flex-col lg:items-start">
            <p className="flex items-center gap-3 rounded-card border border-line bg-surface px-5 py-4">
              <Building2 className="size-6 text-institutional-dark" aria-hidden="true" />
              <span>
                <strong className="block font-display text-2xl leading-none font-extrabold">
                  {data?.length ?? 14}
                </strong>
                <span className="text-sm text-ink-soft">empresas parceiras</span>
              </span>
            </p>

            <ButtonLink to="/parceiros" variant="outline">
              <HeartHandshake className="size-5" aria-hidden="true" />
              Quero ser parceiro
            </ButtonLink>
          </div>
        </div>

        {isPending && (
          <ul className="mt-10 flex flex-wrap justify-center gap-4">
            {Array.from({ length: 7 }).map((_, index) => (
              <li key={index}>
                <Skeleton className="h-24 w-44" />
              </li>
            ))}
          </ul>
        )}

        {isError && (
          <div className="mt-10 max-w-md">
            <StateMessage
              tone="error"
              title="A lista de parceiros não carregou"
              description="Não conseguimos buscar as empresas parceiras agora."
              action={
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="font-display font-bold text-primary underline underline-offset-4"
                >
                  Tentar de novo
                </button>
              }
            />
          </div>
        )}

        {data && data.length > 0 && <PartnerMarquee partners={data} />}
      </Container>
    </section>
  )
}
