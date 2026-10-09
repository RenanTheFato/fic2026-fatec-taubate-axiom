import { Award, ExternalLink, FileDown, Folder, FolderOpen, History, Paintbrush } from "lucide-react"
import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { AdminPage, StatTile } from "../../components/admin/admin-ui"
import { DataList } from "../../components/admin/data-list"
import type { Column } from "../../components/admin/data-list"
import { TYPE_LABEL } from "../../components/admin/transaction-labels"
import { CertificateArtboard } from "../../components/certificate/certificate-artboard"
import type { CanvasAsset } from "../../components/certificate/certificate-artboard"
import { sampleFields } from "../../components/certificate/certificate-design"
import { SCOPE_LABEL, fallbackLine, folderDestination } from "../../components/certificate/certificate-labels"
import { Badge } from "../../components/ui/badge"
import { Button, ButtonLink } from "../../components/ui/button"
import { Field, SelectInput } from "../../components/ui/field"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { useCertificateAssets, useCertificateDesigns, useCertificateFolders, useIssuedCertificates } from "../../hooks/use-certificates"
import { useSession } from "../../hooks/use-session"
import { assetUrl, issuedCertificateUrl } from "../../services/certificate/certificate-assets-service"
import { previewCertificateVersion } from "../../services/certificate/certificate-designs-service"
import type { CertificateFolder, CertificateVersion, IssuedCertificate } from "../../types/certificate-types"
import { cn } from "../../utils/cn"
import { formatDate, formatNumber } from "../../utils/format"
import { openPdf } from "../../utils/open-pdf"

const EDITOR = "/admin/comunicacao/certificados/editor"

function folderMeta(folder: CertificateFolder): string {
  if (folder.versions === 0) return "sem personalização"

  const versions = folder.versions === 1 ? "1 versão" : `${folder.versions} versões`
  const issued = folder.issued === 1 ? "1 emitido" : `${formatNumber(folder.issued)} emitidos`

  return `${versions} · ${issued}`
}

function editorLink(folder: CertificateFolder, base?: string): string {
  return `${EDITOR}?pasta=${encodeURIComponent(folder.folder)}${base ? `&base=${base}` : ""}`
}

type FolderListProps = {
  folders: CertificateFolder[]
  selected: string
  onSelect: (folder: string) => void
}

// As pastas, agrupadas como a associação pensa: o modelo da casa, as campanhas e
// os eventos. Cada pasta é a história completa de um certificado.
function FolderList({ folders, selected, onSelect }: FolderListProps) {
  const groups = [
    { title: "Modelo da associação", items: folders.filter((folder) => folder.scope === "default") },
    { title: "Campanhas", items: folders.filter((folder) => folder.scope === "campaign") },
    { title: "Eventos", items: folders.filter((folder) => folder.scope === "event") },
  ]

  return (
    <nav aria-label="Pastas de certificados" className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="px-3 font-display text-xs font-bold tracking-[0.16em] text-ink-soft uppercase">{group.title}</p>
          <ul className="mt-2 flex flex-col gap-1">
            {group.items.map((folder) => {
              const active = folder.folder === selected
              const Icon = active ? FolderOpen : Folder

              return (
                <li key={folder.folder}>
                  <button
                    type="button"
                    onClick={() => onSelect(folder.folder)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-tile px-3 py-2.5 text-left transition-colors",
                      active ? "bg-primary-soft text-ink" : "hover:bg-surface-muted",
                    )}
                  >
                    <Icon className={cn("mt-0.5 size-5 shrink-0", folder.versions > 0 ? "text-primary" : "text-ink-soft")} aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block font-display text-sm font-bold break-words">{folder.title}</span>
                      <span className="block text-xs text-ink-soft">{folderMeta(folder)}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

type VersionCardProps = {
  version: CertificateVersion
  current: boolean
  folder: CertificateFolder
  assets: Map<string, CanvasAsset>
  fields: Record<string, string>
  onPreview: (version: CertificateVersion) => void
}

function VersionCard({ version, current, folder, assets, fields, onPreview }: VersionCardProps) {
  const issued = version.issued === 1 ? "1 recibo" : `${formatNumber(version.issued)} recibos`

  return (
    <li className="flex flex-col overflow-hidden rounded-card border border-line bg-surface">
      <div className="border-b border-line bg-surface-muted p-3">
        <CertificateArtboard
          design={version.design}
          assets={assets}
          fields={fields}
          label={`Miniatura da versão ${version.version}, ${version.label}`}
          className="h-auto w-full rounded-tile shadow-sm"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-base font-bold">Versão {version.version}</h3>
          {current && <Badge tone="success">Atual</Badge>}
        </div>
        <p className="line-clamp-2 min-h-[2lh] text-sm font-semibold break-words">{version.label}</p>
        <p className="text-xs text-ink-soft">
          {formatDate(version.created_at)}
          {version.author ? ` · ${version.author.name}` : ""} · {issued}
        </p>
        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <Button size="sm" variant="outline" tone="ink" onClick={() => onPreview(version)}>
            <FileDown className="size-4" aria-hidden="true" />
            PDF
          </Button>
          <ButtonLink to={editorLink(folder, version.id)} size="sm" variant="outline" tone="ink" ariaLabel={`Editar a partir da versão ${version.version}`}>
            <Paintbrush className="size-4" aria-hidden="true" />
            Editar a partir desta
          </ButtonLink>
        </div>
      </div>
    </li>
  )
}

function IssuedList({ folder }: { folder: CertificateFolder }) {
  const [page, setPage] = useState(1)
  const { data, isPending, isError, refetch } = useIssuedCertificates(folder.folder, page, true)

  const columns: Column<IssuedCertificate>[] = [
    { key: "number", header: "Recibo", primary: true, nowrap: true, cell: (row) => row.number },
    { key: "donor", header: "Doador", cell: (row) => row.donor_name },
    { key: "type", header: "Tipo", hideBelow: "xl", nowrap: true, cell: (row) => TYPE_LABEL[row.transaction_type] },
    { key: "version", header: "Versão", nowrap: true, cell: (row) => (row.design_version ? `v${row.design_version}` : "de fábrica") },
    { key: "issued", header: "Emitido em", hideBelow: "xl", nowrap: true, cell: (row) => formatDate(row.issued_at) },
    {
      key: "status",
      header: "Situação",
      nowrap: true,
      cell: (row) => (row.status === "issued" ? <Badge tone="success">Válido</Badge> : <Badge tone="institutional">Cancelado</Badge>),
    },
  ]

  const pages = data ? Math.max(Math.ceil(data.total / 20), 1) : 1

  if (isPending) return <Skeleton className="h-40 w-full" />

  if (isError) {
    return (
      <StateMessage
        tone="error"
        title="A lista de emitidos não carregou"
        description="Não conseguimos buscar os certificados desta pasta agora."
        action={
          <button type="button" onClick={() => refetch()} className="font-display font-bold text-primary underline underline-offset-4">
            Tentar de novo
          </button>
        }
      />
    )
  }

  if (data.certificates.length === 0) {
    return <StateMessage title="Nenhum certificado emitido nesta pasta" description="Eles aparecem aqui assim que o primeiro pagamento for confirmado." />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-card border-line bg-surface lg:border lg:p-2">
        <DataList
          caption={`Certificados emitidos na pasta ${folder.title}`}
          columns={columns}
          rows={data.certificates}
          rowKey={(row) => row.id}
          breakpoint="lg"
          actions={(row) => (
            <ButtonLink
              to={issuedCertificateUrl(row.hash)}
              external
              ariaLabel={`Abrir o certificado do recibo ${row.number}, de ${row.donor_name}`}
              size="sm"
              variant="outline"
              tone="ink"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              Abrir
            </ButtonLink>
          )}
        />
      </div>

      {pages > 1 && (
        <nav aria-label="Paginação dos certificados emitidos" className="flex items-center justify-between gap-3">
          <Button size="sm" variant="outline" tone="ink" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Anterior
          </Button>
          <p className="text-sm text-ink-soft">
            Página {page} de {pages}
          </p>
          <Button size="sm" variant="outline" tone="ink" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            Próxima
          </Button>
        </nav>
      )}
    </div>
  )
}

// O estúdio de certificados. Cada campanha e cada evento tem uma pasta, e cada
// pasta guarda todas as versões que o certificado dela já teve. Nada é editado
// por cima: personalizar cria a próxima versão, e todo recibo continua saindo
// com a versão com que nasceu.
export default function CertificatesPage() {
  const { user } = useSession()
  const [params, setParams] = useSearchParams()
  const folders = useCertificateFolders()
  const library = useCertificateAssets()
  const [previewError, setPreviewError] = useState(false)

  const list = folders.data?.folders
  const requested = params.get("pasta") ?? "default"
  const folder = list?.find((item) => item.folder === requested) ?? list?.[0] ?? null
  const designs = useCertificateDesigns(folder?.folder ?? null)
  const defaults = useCertificateDesigns("default")
  const savedVersion = params.get("salvo")

  // Só a Administração vê a lista de emitidos: ela traz nome de doador, e esta
  // tela também é da Comunicação, que vê só as contagens.
  const canSeeIssued = user?.role === "admin"

  const assets = useMemo(() => {
    const map = new Map<string, CanvasAsset>()

    for (const asset of library.data ?? []) {
      map.set(asset.id, { url: assetUrl(asset.id), name: asset.name })
    }

    return map
  }, [library.data])

  const fields = useMemo(() => sampleFields("donation", folder ? folderDestination(folder) : null), [folder])

  function select(next: string) {
    setParams({ pasta: next })
  }

  async function preview(version: CertificateVersion) {
    setPreviewError(false)
    await openPdf(() => previewCertificateVersion(version.id)).catch(() => setPreviewError(true))
  }

  const customized = list ? list.filter((item) => item.versions > 0).length : 0
  const totalVersions = list ? list.reduce((total, item) => total + item.versions, 0) : 0
  const totalIssued = list ? list.reduce((total, item) => total + item.issued, 0) : 0
  const current = designs.data?.[0] ?? null
  const shown = current?.design ?? (folder?.scope === "default" ? null : defaults.data?.[0]?.design) ?? folders.data?.factory ?? null

  return (
    <AdminPage title="Certificados">
      {list && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile icon={FolderOpen} label="Pastas personalizadas" value={`${customized} de ${list.length}`} />
          <StatTile icon={History} label="Versões guardadas" value={formatNumber(totalVersions)} />
          <StatTile icon={Award} label="Certificados emitidos" value={formatNumber(totalIssued)} hint="Com versão personalizada" />
        </div>
      )}

      {savedVersion && folder && (
        <StateMessage title={`Versão ${savedVersion} salva em ${folder.title}`} description="Vale para os próximos recibos desta pasta." />
      )}

      {previewError && <StateMessage tone="error" title="A prévia não abriu" description="Tente de novo em instantes." />}

      {folders.isPending && (
        <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      )}

      {folders.isError && (
        <StateMessage
          tone="error"
          title="As pastas não carregaram"
          description="Não conseguimos buscar os certificados agora."
          action={
            <button type="button" onClick={() => folders.refetch()} className="font-display font-bold text-primary underline underline-offset-4">
              Tentar de novo
            </button>
          }
        />
      )}

      {list && folder && (
        <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
          <div className="lg:hidden">
            <Field id="pasta-certificado" label="Pasta" required>
              {(control) => (
                <SelectInput {...control} value={folder.folder} onChange={(event) => select(event.target.value)}>
                  {list.map((item) => (
                    <option key={item.folder} value={item.folder}>
                      {SCOPE_LABEL[item.scope].label}: {item.title} ({folderMeta(item)})
                    </option>
                  ))}
                </SelectInput>
              )}
            </Field>
          </div>

          <aside className="hidden rounded-card border border-line bg-surface p-3 lg:sticky lg:top-32 lg:block lg:max-h-[calc(100dvh-9rem)] lg:overflow-y-auto">
            <FolderList folders={list} selected={folder.folder} onSelect={select} />
          </aside>

          <section aria-labelledby="pasta-atual" className="flex min-w-0 flex-col gap-8">
            <div className="flex flex-col gap-5 rounded-card border border-line bg-surface p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={SCOPE_LABEL[folder.scope].tone}>{SCOPE_LABEL[folder.scope].label}</Badge>
                    {folder.current && <Badge tone="success">Versão {folder.current.version} em uso</Badge>}
                  </div>
                  <h2 id="pasta-atual" className="mt-3 font-display text-2xl font-extrabold break-words">
                    {folder.title}
                  </h2>
                  <p className="mt-1 text-sm text-ink-soft">
                    {folder.current ? `"${folder.current.label}", desde ${formatDate(folder.current.created_at)}` : fallbackLine(folder.scope)}
                  </p>
                </div>

                <ButtonLink to={editorLink(folder)} size="sm" className="shrink-0">
                  <Paintbrush className="size-4" aria-hidden="true" />
                  {folder.current ? "Personalizar" : "Criar a primeira versão"}
                </ButtonLink>
              </div>

              {designs.isPending || !shown ? (
                <Skeleton className="aspect-[842/595] w-full" />
              ) : (
                <div className="rounded-card bg-surface-muted p-3 sm:p-5">
                  <CertificateArtboard
                    design={shown}
                    assets={assets}
                    fields={fields}
                    label={`Como o certificado de ${folder.title} sai hoje`}
                    className="mx-auto h-auto w-full max-w-4xl rounded-tile shadow-lg"
                  />
                </div>
              )}
            </div>

            <section aria-labelledby="historico" className="flex flex-col gap-4">
              <h2 id="historico" className="font-display text-xl font-bold">
                Histórico de versões
              </h2>

              {designs.isError && (
                <StateMessage
                  tone="error"
                  title="O histórico não carregou"
                  description="Não conseguimos buscar as versões desta pasta agora."
                  action={
                    <button type="button" onClick={() => designs.refetch()} className="font-display font-bold text-primary underline underline-offset-4">
                      Tentar de novo
                    </button>
                  }
                />
              )}

              {designs.data && designs.data.length === 0 && <StateMessage title="Nenhuma versão nesta pasta" description={fallbackLine(folder.scope)} />}

              {designs.data && designs.data.length > 0 && (
                <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {designs.data.map((version, index) => (
                    <VersionCard
                      key={version.id}
                      version={version}
                      current={index === 0}
                      folder={folder}
                      assets={assets}
                      fields={fields}
                      onPreview={preview}
                    />
                  ))}
                </ul>
              )}
            </section>

            {canSeeIssued && (
              <section aria-labelledby="emitidos" className="flex flex-col gap-4">
                <h2 id="emitidos" className="font-display text-xl font-bold">
                  Certificados emitidos
                </h2>
                <IssuedList key={folder.folder} folder={folder} />
              </section>
            )}
          </section>
        </div>
      )}
    </AdminPage>
  )
}
