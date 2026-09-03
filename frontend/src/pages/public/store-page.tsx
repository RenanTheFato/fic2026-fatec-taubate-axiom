import { HandHeart } from "lucide-react"
import { PageHero } from "../../components/layout/page-hero"
import { ReadingModeToggle } from "../../components/layout/reading-mode-toggle"
import { ReadingSwitch } from "../../components/layout/reading-switch"
import { Reveal } from "../../components/motion/reveal"
import { ProductCard } from "../../components/product/product-card"
import { ButtonLink } from "../../components/ui/button"
import { Container } from "../../components/ui/container"
import { SectionHeading } from "../../components/ui/section"
import { CardSkeleton, StateMessage } from "../../components/ui/states"
import { useProducts } from "../../hooks/use-products"

export default function StorePage() {
  const { data, isPending, isError, refetch } = useProducts()

  const available = data ? data.products.filter((product) => product.stock > 0) : []
  const soldOut = data ? data.products.filter((product) => product.stock <= 0) : []

  return (
    <>
      <PageHero
        eyebrow="Loja"
        title="Cada compra vira programa"
        breadcrumb={[{ label: "Loja" }]}
        tone="success"
        scene="drift"
        action={<ReadingModeToggle tone="ink" />}
        lead={
          <ReadingSwitch
            simple={
              <p>
                Aqui você compra produtos da associação. O dinheiro da venda paga os programas. Vários
                produtos são feitos na Oficina Terapêutica.
              </p>
            }
          >
            <p>
              O que você leva daqui sustenta o Ambulatório, a Escola e a Oficina Terapêutica, e boa
              parte das peças é produzida pelos próprios jovens do programa de trabalho protegido.
            </p>
          </ReadingSwitch>
        }
      />

      <section aria-labelledby="catalogo" className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            id="catalogo"
            eyebrow="Catálogo"
            title="Produtos disponíveis"
            description="Preço e disponibilidade vêm direto do estoque da associação."
            tone="success"
          />

          {isPending && (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <CardSkeleton key={index} />
              ))}
            </div>
          )}

          {isError && (
            <div className="mt-10 max-w-md">
              <StateMessage
                tone="error"
                title="O catálogo não carregou"
                description="Não conseguimos buscar os produtos agora."
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

          {data && data.products.length === 0 && (
            <div className="mt-10 max-w-md">
              <StateMessage
                title="A loja está sendo reabastecida"
                description="Nenhum produto está à venda no momento. Enquanto isso, a doação direta chega ao mesmo lugar."
                action={
                  <ButtonLink to="/doe-agora" size="sm">
                    Doar agora
                  </ButtonLink>
                }
              />
            </div>
          )}

          {available.length > 0 && (
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {available.map((product, index) => (
                <li key={product.id}>
                  <Reveal delay={index * 0.05} className="h-full">
                    <ProductCard product={product} />
                  </Reveal>
                </li>
              ))}
            </ul>
          )}

          {soldOut.length > 0 && (
            <div className="mt-16">
              <h3 className="font-display text-xl font-bold">Esgotados no momento</h3>
              <p className="mt-2 text-sm text-ink-soft">
                Continuam listados porque costumam voltar. Fale com a associação para saber da próxima
                remessa.
              </p>

              <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {soldOut.map((product) => (
                  <li key={product.id}>
                    <ProductCard product={product} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Container>
      </section>

      <section className="bg-surface-muted py-16 sm:py-20">
        <Container className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <HandHeart className="mt-1 size-8 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <h2 className="font-display text-xl font-bold">Prefere apoiar sem levar nada?</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
                A doação direta chega ao mesmo lugar, sem custo de produção no caminho.
              </p>
            </div>
          </div>

          <ButtonLink to="/doe-agora" className="shrink-0">
            Doar agora
          </ButtonLink>
        </Container>
      </section>
    </>
  )
}
