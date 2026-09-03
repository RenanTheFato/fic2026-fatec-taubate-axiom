import { Link } from "react-router-dom"
import { cn } from "../../utils/cn"

type LogoProps = {
  className?: string
  tone?: "color" | "light"
  /** Para onde a marca leva. O site público volta para a home; o painel, para o painel. */
  to?: string
  alt?: string
}

// Logo oficial da ONG. Os arquivos de origem ficam em `brand/` (1920px, com
// margem); o que é servido em `public/` é a versão recortada e redimensionada.
// A versão branca é o lockup monocromático com o preto virado em branco, para
// o rodapé escuro.
export function Logo({ className, tone = "color", to = "/", alt }: LogoProps) {
  return (
    <Link to={to} className="inline-flex shrink-0 rounded-pill">
      <img
        src={tone === "light" ? "/logo-branco.png" : "/logo.png"}
        alt={alt ?? "Somos do Bem, página inicial"}
        width={200}
        height={132}
        className={cn("w-auto", className ?? "h-12 sm:h-14")}
      />
    </Link>
  )
}
