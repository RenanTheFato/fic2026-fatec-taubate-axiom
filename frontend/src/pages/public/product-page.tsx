import { PackageCheck, ShieldCheck, Truck } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { CheckoutForm } from "../../components/checkout/checkout-form"
import { PageHero } from "../../components/layout/page-hero"
import { Reveal } from "../../components/motion/reveal"
import { Badge } from "../../components/ui/badge"
import { ButtonLink } from "../../components/ui/button"
import { Container } from "../../components/ui/container"
import { ImageSlot } from "../../components/ui/image-slot"
import { Prose } from "../../components/ui/prose"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { NotFoundError } from "../../config/errors"
import { useProduct } from "../../hooks/use-product"
import { formatCurrency } from "../../utils/format"

const ASSURANCES = [
  { icon: ShieldCheck, text: "Pagamento no ambiente do Stripe. A associação não guarda o número do cartão." },
  { icon: PackageCheck, text: "Boa parte das peças é produzida na Oficina Terapêutica." },
  { icon: Truck, text: "A retirada e a entrega são combinadas por e-mail depois da confirmação." },
]

export default function ProductPage() {
  const { produto = "" } = useParams()
  const { data: product, isPending, isError, error, refetch } = useProduct(produto)

  if (isPending) {
    return (
      <Container className="py-16">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="mt-10 h-80 w-full" />
      </Container>
    )
  }

  if (isError) {
    const missing = error instanceof NotFoundError

    return (
      <Container className="py-16">
        <div className="max-w-lg">
          <StateMessage
            tone={missing ? "neutral" : "error"}
            title={missing ? "Produto não encontrado" : "O produto não carregou"}
            description={
              missing
                ? "Este endereço não corresponde a nenhum produto à venda. Ele pode ter saído de linha desde que o link foi compartilhado."
                : "Não conseguimos buscar este produto agora."
            }
            action={
              missing ? (
                <ButtonLink to="/loja" size="sm">
                  Ver a loja
                </ButtonLink>
              ) : (
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="font-display font-bold text-primary underline underline-offset-4"
                >
                  Tentar de novo
                </button>
              )
            }
          />
        </div>
      </Container>
    )
  }

  const soldOut = product.stock <= 0

  return (
    <>
      <PageHero
        eyebrow="Loja"
        title={product.name}
        tone="success"
        breadcrumb={[{ label: "Loja", to: "/loja" }, { label: product.name }]}
        lead={<p>{formatCurrency(product.price)}</p>}
      >
        <div className="mt-6 flex flex-wrap gap-2">
          {soldOut ? <Badge tone="alert">Esgotado</Badge> : <Badge tone="success">Disponível</Badge>}
          {product.sku && <Badge tone="institutional">{product.sku}</Badge>}
        </div>
      </PageHero>

      <section className="py-14 sm:py-20">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-start">
          <Reveal from="left">
            <div className="overflow-hidden rounded-card border border-line">
              <ImageSlot
                src={product.image_url}
                ratio="1/1"
                alt={product.name}
                hint={`Foto do produto "${product.name}", em fundo claro`}
                eager
              />
            </div>

            {product.description && (
              <Prose className="mt-8">
                <p>{product.description}</p>
              </Prose>
            )}

            <ul className="mt-8 flex flex-col gap-3">
              {ASSURANCES.map((item) => (
                <li key={item.text} className="flex items-start gap-3 text-sm text-ink-soft">
                  <item.icon className="mt-0.5 size-5 shrink-0 text-success-dark" aria-hidden="true" />
                  {item.text}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal from="right" delay={0.1}>
            <div className="rounded-card border border-line bg-surface p-6 sm:p-8 lg:sticky lg:top-8">
              {soldOut ? (
                <StateMessage
                  title="Esgotado no momento"
                  description="Este produto costuma voltar. Fale com a associação para saber da próxima remessa, ou apoie por uma doação direta."
                  action={
                    <ButtonLink to="/doe-agora" size="sm">
                      Doar agora
                    </ButtonLink>
                  }
                />
              ) : (
                <>
                  <h2 className="font-display text-2xl font-extrabold">Comprar</h2>
                  <p className="mt-2 mb-5 text-sm leading-relaxed text-ink-soft">
                    Uma unidade por pedido. O estoque é conferido de novo no momento da confirmação, e
                    quem decide é o sistema da associação, não esta tela.
                  </p>

                  <CheckoutForm
                    type="product"
                    title={product.name}
                    fixedAmount={product.price}
                    items={[{ product_id: product.id, quantity: 1 }]}
                    submitLabel="Ir para o pagamento"
                  />
                </>
              )}

              <p className="mt-6 text-sm text-ink-soft">
                Precisa de mais de uma unidade?{" "}
                <Link to="/fale-conosco" className="font-bold text-primary underline underline-offset-4">
                  Fale com a associação
                </Link>
                .
              </p>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  )
}
