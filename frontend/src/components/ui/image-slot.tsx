import { ImageIcon } from "lucide-react"
import { cn } from "../../utils/cn"

export type ImageRatio = "16/9" | "4/3" | "3/2" | "1/1" | "3/4"

type ImageSlotProps = {
  src?: string | null
  alt: string
  /** O que a foto precisa mostrar. Aparece no lugar reservado enquanto ela não existe. */
  hint: string
  ratio?: ImageRatio
  className?: string
  eager?: boolean
}

const RATIO: Record<ImageRatio, string> = {
  "16/9": "aspect-[16/9]",
  "4/3": "aspect-[4/3]",
  "3/2": "aspect-[3/2]",
  "1/1": "aspect-square",
  "3/4": "aspect-[3/4]",
}

// Todo lugar do site que espera foto usa este componente, com o espaço já
// reservado na proporção final. Enquanto o arquivo não existe, o lugar mostra
// o que deve entrar ali em vez de sumir, assim o layout não muda quando a foto
// chega, e ninguém precisa adivinhar qual imagem vai onde.
//
// **Quem manda na altura é a caixa, nunca a imagem.** A `<img>` fica absoluta
// dentro de um bloco que já tem a proporção, então um arquivo alto, um baixo e
// um lugar vazio ocupam exatamente o mesmo espaço. Sem isso, a imagem era ela
// própria o item flex do card: `h-full` a fazia disputar a altura com o texto e
// `flex-shrink` a encolhia conforme o vizinho tivesse título de uma ou de três
// linhas, que é o motivo de dois cards lado a lado nunca baterem.
export function ImageSlot({ src, alt, hint, ratio = "4/3", className, eager }: ImageSlotProps) {
  return (
    <div className={cn("relative w-full shrink-0 overflow-hidden bg-surface-muted", RATIO[ratio], className)}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div
          role="img"
          aria-label={`Espaço reservado para foto: ${hint}`}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 border border-dashed border-line p-6 text-center"
        >
          <ImageIcon className="size-7 shrink-0 text-ink-soft/70" aria-hidden="true" />
          <p className="line-clamp-3 max-w-xs font-display text-sm font-bold text-ink-soft">{hint}</p>
          <p className="text-xs text-ink-soft/80">proporção {ratio}</p>
        </div>
      )}
    </div>
  )
}
