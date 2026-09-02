import { Download, FileText } from "lucide-react"
import type { TransparencyDocument } from "../../types/institutional-types"
import { Card } from "../ui/card"

type DocumentCardProps = {
  document: TransparencyDocument
}

export function DocumentCard({ document }: DocumentCardProps) {
  return (
    <Card as="article" interactive className="h-full">
      <div className="flex h-full flex-col gap-3 p-5">
        <span className="flex size-11 items-center justify-center rounded-tile bg-institutional-soft text-institutional-dark">
          <FileText className="size-5" aria-hidden="true" />
        </span>

        <h3 className="font-display text-lg leading-snug font-bold">{document.title}</h3>

        {document.description && <p className="text-sm leading-relaxed text-ink-soft">{document.description}</p>}

        <p className="mt-auto pt-2">
          <a
            href={document.file}
            download
            className="inline-flex min-h-11 items-center gap-2 font-display text-sm font-bold text-primary underline underline-offset-4 hover:text-primary-dark"
          >
            <Download className="size-4" aria-hidden="true" />
            Baixar PDF
            <span className="sr-only">de {document.title}, ano {document.year}</span>
          </a>
        </p>
      </div>
    </Card>
  )
}
