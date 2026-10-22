import { Download, Eye, EyeOff, Plus } from "lucide-react"
import { useState } from "react"
import { AdminPage, StatTile } from "../../components/admin/admin-ui"
import { ConfirmDialog } from "../../components/admin/confirm-dialog"
import { DataList } from "../../components/admin/data-list"
import type { Column } from "../../components/admin/data-list"
import { SocialPostEditor } from "../../components/admin/social-post-editor"
import { NETWORKS } from "../../components/social/social-labels"
import { Badge } from "../../components/ui/badge"
import { Button, ButtonLink } from "../../components/ui/button"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { CheckoutError } from "../../config/errors"
import { useAllSocialPosts, useDeleteSocialPost, useImportInstagram, useSocialPostVisibility } from "../../hooks/use-admin-social"
import { useSession } from "../../hooks/use-session"
import type { AdminSocialPost } from "../../types/social-types"
import { formatDate } from "../../utils/format"

type Editing = { mode: "new" } | { mode: "edit"; post: AdminSocialPost } | null

function failure(error: unknown): string {
  return error instanceof CheckoutError ? error.message : "Não conseguimos falar com o servidor. Nada foi alterado."
}

// A vitrine das redes no site. A Comunicação traz cada publicação com a foto e o
// texto, ou o endereço do vídeo do YouTube; com o token do Instagram configurado
// no servidor, as mais recentes vêm de lá por importação. Esconder tira do site
// sem apagar; apagar é da administração.
export default function SocialPostsPage() {
  const { user } = useSession()
  const { data, isPending, isError, refetch } = useAllSocialPosts()
  const visibility = useSocialPostVisibility()
  const removal = useDeleteSocialPost()
  const importer = useImportInstagram()
  const [editing, setEditing] = useState<Editing>(null)
  const [removing, setRemoving] = useState<AdminSocialPost | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const isAdmin = user?.role === "admin"
  const visible = data ? data.posts.filter((post) => post.visible).length : 0

  function closeRemoval() {
    setRemoving(null)
    removal.reset()
  }

  const columns: Column<AdminSocialPost>[] = [
    {
      key: "caption",
      header: "Publicação",
      primary: true,
      cell: (row) => <span className="line-clamp-2 break-words">{row.caption}</span>,
    },
    {
      key: "network",
      header: "Rede",
      nowrap: true,
      cell: (row) => {
        const network = NETWORKS[row.network]

        return (
          <span className="inline-flex items-center gap-1.5">
            <network.icon className="size-4" aria-hidden="true" />
            {network.label}
          </span>
        )
      },
    },
    { key: "published", header: "Publicada em", nowrap: true, cell: (row) => formatDate(row.published_at) },
    { key: "origin", header: "Origem", hideBelow: "xl", nowrap: true, cell: (row) => (row.external_id ? "Importada" : (row.author?.name ?? "equipe")) },
    {
      key: "status",
      header: "No site",
      nowrap: true,
      cell: (row) => (row.visible ? <Badge tone="success">Visível</Badge> : <Badge tone="institutional">Escondida</Badge>),
    },
  ]

  return (
    <AdminPage
      title="Redes sociais"
      action={
        editing === null && (
          <div className="flex flex-wrap gap-2">
            {data?.instagram_import && (
              <Button
                size="sm"
                variant="outline"
                tone="ink"
                disabled={importer.isPending}
                onClick={() => {
                  setNotice(null)
                  importer.mutate(undefined, {
                    onSuccess: (result) =>
                      setNotice(
                        result.imported === 0
                          ? "Nenhuma publicação nova no Instagram."
                          : `${result.imported === 1 ? "1 publicação nova" : `${result.imported} publicações novas`} do Instagram ${result.imported === 1 ? "entrou" : "entraram"} no site.`,
                      ),
                  })
                }}
              >
                <Download className="size-4" aria-hidden="true" />
                {importer.isPending ? "Importando…" : "Importar do Instagram"}
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => {
                setNotice(null)
                setEditing({ mode: "new" })
              }}
            >
              <Plus className="size-4" aria-hidden="true" />
              Nova publicação
            </Button>
          </div>
        )
      }
    >
      {data && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile icon={Eye} label="No site" value={String(visible)} />
          <StatTile icon={EyeOff} label="Escondidas" value={String(data.posts.length - visible)} />
          <StatTile icon={Download} label="Importadas" value={String(data.posts.filter((post) => post.external_id).length)} hint="Pelo Instagram" />
        </div>
      )}

      {notice && <StateMessage title="Pronto" description={notice} />}

      {editing && (
        <SocialPostEditor
          key={editing.mode === "edit" ? editing.post.id : "nova"}
          post={editing.mode === "edit" ? editing.post : undefined}
          onDone={(message) => {
            setEditing(null)
            setNotice(message)
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      {(visibility.isError || importer.isError) && (
        <StateMessage tone="error" title="A operação não foi concluída" description={failure(visibility.error ?? importer.error)} />
      )}

      {isPending && <Skeleton className="h-64 w-full" />}

      {isError && (
        <StateMessage
          tone="error"
          title="As publicações não carregaram"
          description="Não conseguimos buscar as redes sociais agora."
          action={
            <button type="button" onClick={() => refetch()} className="font-display font-bold text-primary underline underline-offset-4">
              Tentar de novo
            </button>
          }
        />
      )}

      {data && data.posts.length === 0 && <StateMessage title="Nenhuma publicação no site" description="As publicações cadastradas aparecem aqui e na página de redes sociais." />}

      {data && data.posts.length > 0 && (
        <div className="rounded-card border-line bg-surface lg:border lg:p-2">
          <DataList
            caption="Publicações das redes sociais no site"
            columns={columns}
            rows={data.posts}
            rowKey={(row) => row.id}
            breakpoint="xl"
            actions={(row) => (
              <>
                <Button size="sm" variant="outline" tone="ink" onClick={() => setEditing({ mode: "edit", post: row })}>
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  tone="ink"
                  disabled={visibility.isPending}
                  onClick={() => {
                    setNotice(null)
                    visibility.mutate(
                      { id: row.id, visible: !row.visible },
                      { onSuccess: () => setNotice(row.visible ? "A publicação saiu do site." : "A publicação voltou para o site.") },
                    )
                  }}
                >
                  {row.visible ? "Esconder" : "Mostrar"}
                </Button>
                {isAdmin ? (
                  <Button size="sm" variant="outline" tone="primary" onClick={() => setRemoving(row)}>
                    Apagar
                  </Button>
                ) : (
                  <ButtonLink to={row.url} external size="sm" variant="outline" tone="ink" ariaLabel={`Abrir a publicação no ${NETWORKS[row.network].label}`}>
                    Abrir
                  </ButtonLink>
                )}
              </>
            )}
          />
        </div>
      )}

      {removing && (
        <ConfirmDialog
          title="Apagar a publicação do site?"
          consequence="Ela sai da página de redes sociais e da home. A publicação na rede continua lá. Para só tirar do site por um tempo, use Esconder."
          confirmLabel="Apagar do site"
          pending={removal.isPending}
          error={removal.isError ? failure(removal.error) : null}
          onClose={closeRemoval}
          onConfirm={() =>
            removal.mutate(removing.id, {
              onSuccess: () => {
                setNotice("A publicação foi apagada do site.")
                closeRemoval()
              },
            })
          }
        />
      )}
    </AdminPage>
  )
}
