import { FilePen, Newspaper, PenLine, Plus } from "lucide-react"
import { useState } from "react"
import { AdminPage, StatTile } from "../../components/admin/admin-ui"
import { DataList } from "../../components/admin/data-list"
import type { Column } from "../../components/admin/data-list"
import { PostEditor } from "../../components/admin/post-editor"
import { CATEGORY_LABEL } from "../../components/news/news-labels"
import { Badge } from "../../components/ui/badge"
import type { BadgeTone } from "../../components/ui/badge"
import { Button, ButtonLink } from "../../components/ui/button"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { CheckoutError } from "../../config/errors"
import { useAllPosts, usePostAction } from "../../hooks/use-admin-posts"
import type { AdminPost, NewsStatus } from "../../types/news-types"
import { formatDate } from "../../utils/format"

const STATUS: Record<NewsStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Rascunho", tone: "alert" },
  published: { label: "Publicada", tone: "success" },
  archived: { label: "Arquivada", tone: "institutional" },
}

type Editing = { mode: "new" } | { mode: "edit"; post: AdminPost } | null

// As notícias da associação. Escrever e publicar são dois atos: o texto nasce
// rascunho, e só "Publicar" o põe no site. O que já esteve no ar sai por
// arquivamento, e não por exclusão, porque pode ter sido lido e compartilhado.
export default function PostsPage() {
  const { data, isPending, isError, refetch } = useAllPosts()
  const action = usePostAction()
  const [editing, setEditing] = useState<Editing>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const columns: Column<AdminPost>[] = [
    { key: "title", header: "Notícia", primary: true, cell: (row) => row.title },
    {
      key: "category",
      header: "Assunto",
      hideBelow: "xl",
      nowrap: true,
      cell: (row) => <Badge tone={CATEGORY_LABEL[row.category].tone}>{CATEGORY_LABEL[row.category].label}</Badge>,
    },
    {
      key: "published",
      header: "Publicada em",
      nowrap: true,
      cell: (row) => (row.published_at ? formatDate(row.published_at) : "ainda não"),
    },
    { key: "author", header: "Autoria", hideBelow: "xl", cell: (row) => row.author?.name ?? "equipe" },
    {
      key: "status",
      header: "Situação",
      nowrap: true,
      cell: (row) => <Badge tone={STATUS[row.status].tone}>{STATUS[row.status].label}</Badge>,
    },
  ]

  const published = data ? data.filter((post) => post.status === "published").length : 0
  const drafts = data ? data.filter((post) => post.status === "draft").length : 0

  function finish(message: string) {
    setEditing(null)
    setNotice(message)
  }

  return (
    <AdminPage
      title="Notícias"
      action={
        editing === null && (
          <Button
            size="sm"
            onClick={() => {
              setNotice(null)
              setEditing({ mode: "new" })
            }}
          >
            <Plus className="size-4" aria-hidden="true" />
            Escrever notícia
          </Button>
        )
      }
    >
      {data && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile icon={Newspaper} label="No site" value={String(published)} hint="Visíveis no site" />
          <StatTile icon={FilePen} label="Rascunhos" value={String(drafts)} hint="Só a equipe vê" />
          <StatTile icon={PenLine} label="Cadastradas" value={String(data.length)} hint="Inclui arquivadas" />
        </div>
      )}

      {notice && <StateMessage title="Pronto" description={notice} />}

      {editing && (
        <PostEditor
          key={editing.mode === "edit" ? editing.post.id : "nova"}
          post={editing.mode === "edit" ? editing.post : undefined}
          onDone={finish}
          onCancel={() => setEditing(null)}
        />
      )}

      {action.isError && (
        <StateMessage
          tone="error"
          title="A operação não foi concluída"
          description={
            action.error instanceof CheckoutError ? action.error.message : "Não conseguimos falar com o servidor. Nada foi alterado."
          }
        />
      )}

      {isPending && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <StateMessage
          tone="error"
          title="As notícias não carregaram"
          description="Não conseguimos buscar as publicações agora."
          action={
            <button type="button" onClick={() => refetch()} className="font-display font-bold text-primary underline underline-offset-4">
              Tentar de novo
            </button>
          }
        />
      )}

      {data && data.length === 0 && (
        <StateMessage
          title="Nenhuma notícia escrita ainda"
          description="Nenhuma notícia escrita."
          action={
            <Button size="sm" onClick={() => setEditing({ mode: "new" })}>
              Escrever notícia
            </Button>
          }
        />
      )}

      {data && data.length > 0 && (
        <div className="rounded-card border-line bg-surface lg:border lg:p-2">
          <DataList
            caption="Notícias da associação"
            columns={columns}
            rows={data}
            rowKey={(row) => row.id}
            breakpoint="xl"
            actions={(row) => (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  tone="ink"
                  onClick={() => {
                    setNotice(null)
                    setEditing({ mode: "edit", post: row })
                  }}
                >
                  Editar
                </Button>

                {row.status === "published" ? (
                  <>
                    <ButtonLink to={`/noticias/${row.slug}`} size="sm" variant="outline" tone="ink">
                      Ver no site
                    </ButtonLink>
                    <Button
                      size="sm"
                      variant="outline"
                      tone="primary"
                      disabled={action.isPending}
                      onClick={() => action.mutate({ action: "archive", id: row.id })}
                    >
                      Arquivar
                    </Button>
                  </>
                ) : (
                  <Button size="sm" disabled={action.isPending} onClick={() => action.mutate({ action: "publish", id: row.id })}>
                    Publicar
                  </Button>
                )}
              </>
            )}
          />
        </div>
      )}
    </AdminPage>
  )
}
