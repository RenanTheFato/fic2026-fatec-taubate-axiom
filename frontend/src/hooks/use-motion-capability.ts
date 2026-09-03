import { useEffect, useState } from "react"
import { READING_MODE_EVENT } from "./use-reading-mode"

// Portão único de animação do projeto. Todo componente animado pergunta aqui
// antes de mover qualquer pixel, porque o público da ONG usa celular antigo e máquina
// de escola, então movimento é melhoria progressiva, nunca requisito.
//
//   full      anima e pode carregar a cena 3D
//   reduced   anima o essencial (revelação, contador), sem 3D
//   none      nada se move; a página já está completa sem isso

export type MotionCapability = "full" | "reduced" | "none"

type NavigatorWithHints = Navigator & {
  deviceMemory?: number
  connection?: { saveData?: boolean }
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

function detect(): MotionCapability {
  // Sem window ou sem matchMedia (jsdom, navegador antigo), o padrão é a
  // página parada, nunca o contrário.
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "none"

  if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return "none"

  // O Modo Leitura Fácil desliga o movimento junto: quem liga esse modo está
  // pedindo menos coisa acontecendo na tela, não só letra maior.
  if (document.documentElement.dataset.leituraFacil === "on") return "none"

  const hints = navigator as NavigatorWithHints

  if (hints.connection?.saveData) return "reduced"

  const cores = hints.hardwareConcurrency ?? 4
  const memory = hints.deviceMemory ?? 4

  if (cores < 4 || memory < 4) return "reduced"

  return "full"
}

export function useMotionCapability(): MotionCapability {
  // Detecção síncrona na primeira renderização: se ela ficasse num efeito, o
  // elemento pintaria visível e só depois seria escondido para animar, e isso é um
  // piscar que aparece justamente nos aparelhos mais lentos.
  const [capability, setCapability] = useState<MotionCapability>(detect)

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return

    const query = window.matchMedia(REDUCED_MOTION_QUERY)
    const update = () => setCapability(detect())

    query.addEventListener("change", update)
    window.addEventListener(READING_MODE_EVENT, update)

    return () => {
      query.removeEventListener("change", update)
      window.removeEventListener(READING_MODE_EVENT, update)
    }
  }, [])

  return capability
}

export function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas")
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"))
  } catch {
    return false
  }
}
