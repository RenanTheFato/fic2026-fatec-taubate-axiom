import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import {
  READING_MODE_EVENT,
  READING_MODE_STORAGE_KEY,
  ReadingModeContext,
} from "../hooks/use-reading-mode"
import type { ReadingModeValue } from "../hooks/use-reading-mode"

// Modo Leitura Fácil. É contexto porque atravessa a árvore inteira (cabeçalho,
// páginas institucionais e o portão de animação), que é exatamente o caso em
// que o projeto autoriza contexto.
//
// O modo não é só "fonte maior": ele troca texto longo por texto curto e direto
// (ver `ReadingSwitch`), tira o que é decorativo da tela e desliga a animação.
// Fonte grande sozinha não é leitura fácil.

function readStored(): boolean {
  if (typeof window === "undefined") return false

  try {
    return window.localStorage.getItem(READING_MODE_STORAGE_KEY) === "on"
  } catch {
    // Navegador com armazenamento bloqueado: o modo continua funcionando, só
    // não sobrevive ao recarregamento.
    return false
  }
}

type ReadingModeProviderProps = {
  children: ReactNode
}

export function ReadingModeProvider({ children }: ReadingModeProviderProps) {
  const [easyReading, setEasyReading] = useState(readStored)

  useEffect(() => {
    document.documentElement.dataset.leituraFacil = easyReading ? "on" : "off"

    try {
      window.localStorage.setItem(READING_MODE_STORAGE_KEY, easyReading ? "on" : "off")
    } catch {
      // sem armazenamento, o modo vale só para esta visita
    }

    // Avisa quem não consome o contexto: o portão de animação lê o atributo do
    // documento e precisa saber que ele mudou.
    window.dispatchEvent(new Event(READING_MODE_EVENT))
  }, [easyReading])

  const value = useMemo<ReadingModeValue>(
    () => ({ easyReading, toggle: () => setEasyReading((current) => !current) }),
    [easyReading],
  )

  return <ReadingModeContext value={value}>{children}</ReadingModeContext>
}
