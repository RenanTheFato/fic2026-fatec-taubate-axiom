import { createContext, use } from "react"

// O contexto do Modo Leitura Fácil mora aqui, e não junto do provider, para que
// o arquivo do provider exporte só o componente, que é o que o `oxlint` cobra e o
// que mantém o fast refresh funcionando.

export const READING_MODE_STORAGE_KEY = "somosdobem:leitura-facil"
export const READING_MODE_EVENT = "somosdobem:leitura-facil"

export type ReadingModeValue = {
  easyReading: boolean
  toggle: () => void
}

export const ReadingModeContext = createContext<ReadingModeValue | null>(null)

export function useReadingMode(): ReadingModeValue {
  const context = use(ReadingModeContext)

  if (!context) throw new Error("useReadingMode precisa estar dentro de ReadingModeProvider")

  return context
}

// Atalho para o caso mais comum: mostrar a versão curta no lugar da longa.
export function useEasyReading(): boolean {
  return useReadingMode().easyReading
}
