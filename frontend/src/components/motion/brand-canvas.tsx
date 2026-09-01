import { Suspense, lazy, useState } from "react"
import { useMediaQuery } from "../../hooks/use-media-query"
import { supportsWebGL, useMotionCapability } from "../../hooks/use-motion-capability"
import type { SceneVariant } from "./brand-scene"

const BrandScene = lazy(() => import("./brand-scene"))

type BrandCanvasProps = {
  variant: SceneVariant
  className?: string
  minWidth?: number
}

// Porta de entrada das cenas 3D. Quem quiser uma cena usa este componente e não
// precisa repetir a decisão: capacidade do aparelho, WebGL disponível, largura
// mínima e desistência por baixo desempenho ficam todas aqui. Quando qualquer
// uma reprova, o componente não renderiza nada — e o fundo estático da seção,
// que já está lá, é o que todo mundo vê.
export function BrandCanvas({ variant, className, minWidth = 1024 }: BrandCanvasProps) {
  const capability = useMotionCapability()
  const wideEnough = useMediaQuery(`(min-width: ${minWidth}px)`)
  const [webglAvailable] = useState(supportsWebGL)
  const [gaveUp, setGaveUp] = useState(false)

  if (capability !== "full" || !wideEnough || !webglAvailable || gaveUp) return null

  return (
    <Suspense fallback={null}>
      <BrandScene variant={variant} className={className} onFallback={() => setGaveUp(true)} />
    </Suspense>
  )
}
