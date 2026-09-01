import { useEffect } from "react"
import { useLocation } from "react-router-dom"

// Navegação de SPA não reposiciona a página sozinha: sem isto, quem clica num
// link no rodapé chega na próxima página já rolado até o fim dela.
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [pathname])

  return null
}
