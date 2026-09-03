import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { Link2, Link2Off, RotateCcw, ShieldCheck, TriangleAlert } from "lucide-react"
import { useRef, useState } from "react"
import { useMotionCapability } from "../../hooks/use-motion-capability"
import { cn } from "../../utils/cn"

// Demonstração interativa da corrente de recibos. Ela existe porque explicar
// "cada documento carrega o hash do anterior" em texto não convence ninguém:
// quebrar a corrente com o próprio dedo, e ver o estrago se propagar para a
// frente, convence em dois segundos.
//
// Os dados são fictícios e a tela diz isso. O comportamento, não: é exatamente
// o que o backend confere em `GET /receipt/verify/:hash`: conteúdo que bate com
// o próprio hash, e hash que bate com o elo anterior.

type Block = {
  number: string
  amount: string
  hash: string
  tamperedHash: string
}

const BLOCKS: Block[] = [
  { number: "000120", amount: "R$ 50,00", hash: "9f2a41c8", tamperedHash: "9f2a41c8" },
  { number: "000121", amount: "R$ 120,00", hash: "3b7e0d55", tamperedHash: "c104ab72" },
  { number: "000122", amount: "R$ 35,00", hash: "a8c93f10", tamperedHash: "51de7b09" },
  { number: "000123", amount: "R$ 200,00", hash: "6d41e2b7", tamperedHash: "e97c3a44" },
]

type Status = "ok" | "alterado" | "rompido"

function statusOf(index: number, tamperedAt: number | null): Status {
  if (tamperedAt === null || index < tamperedAt) return "ok"
  if (index === tamperedAt) return "alterado"
  return "rompido"
}

const BLOCK_STYLE: Record<Status, string> = {
  ok: "border-line bg-surface",
  alterado: "border-primary bg-primary-soft",
  rompido: "border-alert bg-alert/12",
}

const HASH_STYLE: Record<Status, string> = {
  ok: "text-institutional-dark",
  alterado: "text-primary",
  rompido: "text-alert-dark",
}

const STATUS_LABEL: Record<Status, string> = {
  ok: "confere",
  alterado: "conteúdo alterado",
  rompido: "elo rompido",
}

export function ChainDemo() {
  const capability = useMotionCapability()
  const [tamperedAt, setTamperedAt] = useState<number | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (capability === "none") return

      const blocks = gsap.utils.toArray<HTMLElement>(".chain-block")

      if (tamperedAt === null) {
        // Restauração: uma onda da esquerda para a direita, no sentido em que a
        // corrente é conferida.
        gsap.fromTo(
          blocks,
          { scale: 0.97 },
          { scale: 1, duration: 0.4, ease: "back.out(2)", stagger: 0.06, clearProps: "transform" },
        )
        return
      }

      // O bloco adulterado treme; o estrago viaja para a frente, nunca para trás.
      gsap.fromTo(
        blocks[tamperedAt],
        { x: -7 },
        { x: 0, duration: 0.5, ease: "elastic.out(1, 0.28)", clearProps: "transform" },
      )

      const downstream = blocks.slice(tamperedAt + 1)

      if (downstream.length > 0) {
        gsap.fromTo(
          downstream,
          { opacity: 0.35, y: 6 },
          { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", stagger: 0.09, clearProps: "transform" },
        )
      }
    },
    { scope: rootRef, dependencies: [tamperedAt, capability] },
  )

  return (
    <div ref={rootRef}>
      <ul className="flex flex-col md:flex-row md:items-stretch">
        {BLOCKS.map((block, index) => {
          const status = statusOf(index, tamperedAt)
          const linkBroken = tamperedAt !== null && index > tamperedAt

          return (
            <li key={block.number} className="flex flex-col md:flex-1 md:flex-row md:items-center">
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex shrink-0 items-center justify-center self-center",
                    "h-8 w-8 md:h-8 md:w-10",
                    linkBroken ? "text-alert-dark" : "text-institutional-dark",
                  )}
                >
                  {linkBroken ? <Link2Off className="size-5" /> : <Link2 className="size-5" />}
                </span>
              )}

              <button
                type="button"
                onClick={() => setTamperedAt(tamperedAt === index ? null : index)}
                aria-pressed={tamperedAt === index}
                className={cn(
                  "chain-block flex w-full flex-col gap-2 rounded-card border-2 p-4 text-left transition-colors",
                  "hover:border-ink md:min-h-full",
                  BLOCK_STYLE[status],
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-display text-sm font-bold text-ink">Recibo {block.number}</span>
                  {status === "ok" ? (
                    <ShieldCheck className="size-4 shrink-0 text-success-dark" aria-hidden="true" />
                  ) : (
                    <TriangleAlert className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  )}
                </span>

                <span className="font-display text-lg font-extrabold text-ink">
                  {status === "alterado" ? "R$ 1.200,00" : block.amount}
                </span>

                <span className="flex flex-col gap-0.5 text-xs">
                  <span className="text-ink-soft">
                    anterior: <span className="font-mono">{index === 0 ? "nenhum, é o primeiro" : BLOCKS[index - 1].hash}</span>
                  </span>
                  <span className={cn("font-mono", HASH_STYLE[status])}>
                    {status === "ok" ? block.hash : block.tamperedHash}
                  </span>
                </span>

                <span
                  className={cn(
                    "mt-1 font-display text-xs font-bold uppercase",
                    status === "ok" ? "text-success-dark" : status === "alterado" ? "text-primary" : "text-alert-dark",
                  )}
                >
                  {STATUS_LABEL[status]}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="mt-6 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <p role="status" className="max-w-3xl text-sm leading-relaxed text-ink-soft">
          {tamperedAt === null ? (
            <>
              A corrente está íntegra: o código de cada recibo confere com o próprio conteúdo e com
              o recibo anterior.
            </>
          ) : (
            <>
              O recibo {BLOCKS[tamperedAt].number} foi alterado, então o código dele deixou de bater
              com o conteúdo.{" "}
              {tamperedAt < BLOCKS.length - 1
                ? `E como os ${BLOCKS.length - 1 - tamperedAt} recibos seguintes apontam para o código antigo, o elo deles também se rompeu. Não dá para alterar um documento sem quebrar todos os que vieram depois.`
                : "Era o último da corrente, mas o código não bate com o conteúdo, e a conferência acusa."}
            </>
          )}
        </p>

        {tamperedAt !== null && (
          <button
            type="button"
            onClick={() => setTamperedAt(null)}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-pill border-2 border-ink px-5 font-display text-sm font-bold text-ink transition-colors hover:bg-ink hover:text-white"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Restaurar a corrente
          </button>
        )}
      </div>
    </div>
  )
}
