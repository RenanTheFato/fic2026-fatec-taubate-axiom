import { Link } from "react-router-dom"
import { productPath } from "../../services/product/get-product-by-sku-service"
import type { Product } from "../../types/product-types"
import { formatCurrency } from "../../utils/format"
import { Badge } from "../ui/badge"
import { Card, CardBody, CardText, CardTitle } from "../ui/card"
import { ImageSlot } from "../ui/image-slot"

type ProductCardProps = {
  product: Product
}

// A tela mostra o esgotado que conhece, mas quem decide é o backend: a
// confirmação é um UPDATE condicional com checagem de linha afetada. Aqui o
// selo só evita que alguém entre num fluxo que vai ser recusado no fim.
export function ProductCard({ product }: ProductCardProps) {
  const soldOut = product.stock <= 0

  return (
    <Card as="article" interactive className="h-full">
      <ImageSlot
        src={product.image_url}
        ratio="1/1"
        alt={product.name}
        hint={`Foto do produto "${product.name}", em fundo claro`}
      />

      <CardBody>
        <div className="flex flex-wrap items-center gap-2">
          {soldOut ? <Badge tone="alert">Esgotado</Badge> : <Badge tone="success">Disponível</Badge>}
          {!soldOut && product.stock <= 10 && (
            <span className="text-xs font-semibold text-ink-soft">últimas {product.stock} peças</span>
          )}
        </div>

        <CardTitle>
          <Link to={productPath(product)} className="hover:text-primary">
            {product.name}
          </Link>
        </CardTitle>

        {product.description && <CardText>{product.description}</CardText>}

        <p className="mt-auto pt-2 font-display text-xl font-extrabold text-primary">
          {formatCurrency(product.price)}
        </p>
      </CardBody>
    </Card>
  )
}
