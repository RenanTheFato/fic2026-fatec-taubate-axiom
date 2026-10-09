import {
  ArrowLeft,
  CircleCheck,
  Expand,
  FileDown,
  Keyboard,
  Loader2,
  Magnet,
  PanelLeft,
  PanelRight,
  Redo2,
  Save,
  Shrink,
  TriangleAlert,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import type { FormEvent, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import type { CanvasAsset } from "../../components/certificate/certificate-artboard"
import { TYPE_OPTIONS, elementLabel, problemIndex, problemMessage, sampleFields } from "../../components/certificate/certificate-design"
import { designProblems } from "../../components/certificate/certificate-layout"
import type { DesignProblem } from "../../components/certificate/certificate-layout"
import { SCOPE_LABEL, folderDestination } from "../../components/certificate/certificate-labels"
import { PopoverPanel, ToolButton } from "../../components/certificate/editor/editor-controls"
import { usePopover } from "../../components/certificate/editor/use-popover"
import { EditorCanvas } from "../../components/certificate/editor/editor-canvas"
import { EditorContextMenu } from "../../components/certificate/editor/editor-context-menu"
import type { MenuItem } from "../../components/certificate/editor/editor-context-menu"
import { EditorInspector } from "../../components/certificate/editor/editor-inspector"
import { MOD } from "../../components/certificate/editor/editor-keys"
import { EditorSidePanel } from "../../components/certificate/editor/editor-side-panel"
import type { SideTab } from "../../components/certificate/editor/editor-side-panel"
import { useDesignEditor } from "../../components/certificate/editor/use-design-editor"
import { Badge } from "../../components/ui/badge"
import { ButtonLink } from "../../components/ui/button"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { CheckoutError } from "../../config/errors"
import {
  useCertificateAssets,
  useCertificateDesigns,
  useCertificateFolders,
  useSaveCertificateDesign,
  useUploadCertificateAsset,
} from "../../hooks/use-certificates"
import { assetUrl } from "../../services/certificate/certificate-assets-service"
import { previewCertificate } from "../../services/certificate/certificate-designs-service"
import { parseFolder } from "../../services/certificate/certificate-folders-service"
import { CERTIFICATE_PAGE } from "../../types/certificate-types"
import type { CertificateAsset, CertificateDesign, CertificateFolder } from "../../types/certificate-types"
import type { TransactionType } from "../../types/transaction-types"
import { cn } from "../../utils/cn"
import { openPdf } from "../../utils/open-pdf"

const STUDIO = "/admin/comunicacao/certificados"
const { width: W, height: H } = CERTIFICATE_PAGE
const PAD = 48
const MIN_ZOOM = 0.25
const MAX_ZOOM = 4

const SHORTCUTS: [string, string][] = [
  ["Mover", "Setas (Shift: 10 pt)"],
  ["Editar texto", "Duplo clique ou Enter"],
  ["Selecionar vários", "Shift + clique ou laço"],
  ["Desfazer e refazer", `${MOD}+Z e ${MOD}+Shift+Z`],
  ["Copiar, recortar e colar", `${MOD}+C, ${MOD}+X e ${MOD}+V`],
  ["Duplicar", `${MOD}+D`],
  ["Camada acima e abaixo", `${MOD}+] e ${MOD}+[`],
  ["Travar", `${MOD}+L`],
  ["Negrito, itálico, sublinhado", `${MOD}+B, I e U`],
  ["Zoom", `${MOD}+roda, ${MOD}+= e ${MOD}+-`],
  ["Ajustar à tela", `${MOD}+0`],
  ["Arrastar a mesa", "Espaço + arrastar"],
  ["Girar de 15 em 15°", "Shift ao girar"],
  ["Soltar das guias", "Alt ao arrastar"],
]

function isTyping(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null

  return Boolean(element?.closest?.("input, textarea, select, [contenteditable='true']"))
}

function ShortcutsButton() {
  const { open, anchor, panel, toggle } = usePopover()

  return (
    <div className="relative">
      <ToolButton ref={anchor} icon={Keyboard} label="Atalhos do teclado" pressed={open} onClick={toggle} />
      <PopoverPanel open={open} panelRef={panel} label="Atalhos do teclado" align="end" className="w-80">
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-xs">
          {SHORTCUTS.map(([action, keys]) => (
            <div key={action} className="contents">
              <dt className="text-ink-soft">{action}</dt>
              <dd className="text-right font-semibold">{keys}</dd>
            </div>
          ))}
        </dl>
      </PopoverPanel>
    </div>
  )
}

type CheckButtonProps = {
  problems: DesignProblem[]
  design: CertificateDesign
  assets: Map<string, CanvasAsset>
  onSelect: (id: string) => void
}

// O que impede de salvar, contado na barra e listado ao abrir, com atalho para
// selecionar o elemento que precisa de ajuste.
function CheckButton({ problems, design, assets, onSelect }: CheckButtonProps) {
  const { open, setOpen, anchor, panel, toggle } = usePopover()
  const count = problems.length

  return (
    <div className="relative">
      <button
        ref={anchor}
        type="button"
        aria-expanded={open}
        onClick={toggle}
        className={cn(
          "inline-flex min-h-8 items-center gap-1.5 rounded-tile px-2 text-xs font-semibold",
          count > 0 ? "bg-alert/20 text-ink" : "text-success-dark hover:bg-surface-muted",
        )}
      >
        {count > 0 ? <TriangleAlert className="size-4" aria-hidden="true" /> : <CircleCheck className="size-4" aria-hidden="true" />}
        <span className="hidden md:inline">{count > 0 ? `${count} a corrigir` : "Pronto"}</span>
        <span className="sr-only md:hidden">{count > 0 ? `${count} a corrigir` : "Pronto para salvar"}</span>
      </button>
      <PopoverPanel open={open} panelRef={panel} label="Verificação do certificado" align="end" className="w-80">
        {count === 0 ? (
          <p className="text-sm">O certificado pode ser salvo.</p>
        ) : (
          <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
            {problems.map((problem, index) => {
              const position = problemIndex(problem)
              const element = position !== null ? design.elements[position] : null

              return (
                <li key={index} className="flex flex-col gap-1 rounded-tile border border-line p-2 text-xs">
                  {element && <span className="font-bold">{elementLabel(element, assets)}</span>}
                  <span>{problemMessage(problem)}</span>
                  {element && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(element.id)
                        setOpen(false)
                      }}
                      className="self-start font-semibold underline underline-offset-2"
                    >
                      Selecionar
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </PopoverPanel>
    </div>
  )
}

type SaveButtonProps = {
  nextVersion: number
  problems: number
  saving: boolean
  error: string | null
  onSave: (label: string) => void
}

function SaveButton({ nextVersion, problems, saving, error, onSave }: SaveButtonProps) {
  const { open, anchor, panel, toggle } = usePopover()
  const [label, setLabel] = useState("")
  const [labelError, setLabelError] = useState<string | undefined>()
  const field = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) field.current?.focus()
  }, [open])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = label.trim()

    if (trimmed.length < 2) {
      setLabelError('Dê um nome a esta versão, como "Natal com enfeites dourados".')
      field.current?.focus()
      return
    }

    setLabelError(undefined)
    onSave(trimmed)
  }

  return (
    <div className="relative">
      <button
        ref={anchor}
        type="button"
        aria-expanded={open}
        onClick={toggle}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-pill bg-primary px-4 text-sm font-bold text-white hover:bg-primary-dark"
      >
        <Save className="size-4" aria-hidden="true" />
        Salvar
      </button>
      <PopoverPanel open={open} panelRef={panel} label={`Salvar a versão ${nextVersion}`} align="end" className="w-80">
        <form onSubmit={submit} noValidate className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-bold">Nome desta versão</span>
            <input
              ref={field}
              value={label}
              maxLength={120}
              aria-invalid={labelError ? true : undefined}
              aria-describedby={labelError ? "erro-nome-versao" : undefined}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Natal com enfeites dourados"
              className="h-10 rounded-tile border border-line px-3 text-sm outline-none focus:border-ink"
            />
          </label>
          {labelError && (
            <p id="erro-nome-versao" className="text-xs font-semibold text-primary">
              {labelError}
            </p>
          )}
          {problems > 0 && (
            <p className="text-xs font-semibold text-primary">
              Corrija {problems === 1 ? "o problema apontado" : `os ${problems} problemas apontados`} antes de salvar.
            </p>
          )}
          {error && (
            <p role="alert" className="text-xs font-semibold text-primary">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={saving || problems > 0}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-pill bg-primary px-4 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
            Salvar versão {nextVersion}
          </button>
        </form>
      </PopoverPanel>
    </div>
  )
}

type EditorProps = {
  folder: CertificateFolder
  initial: CertificateDesign
  baseLabel: string
  nextVersion: number
  library: CertificateAsset[]
}

function Editor({ folder, initial, baseLabel, nextVersion, library }: EditorProps) {
  const navigate = useNavigate()
  const [type, setType] = useState<TransactionType>("donation")
  const destination = folderDestination(folder)
  const fields = useMemo(() => sampleFields(type, destination), [type, destination])
  const editor = useDesignEditor(initial, fields)
  const { design, selection, setSelection } = editor

  const [tab, setTab] = useState<SideTab>("elementos")
  const [panels, setPanels] = useState({ left: false, right: false })
  const [zoomMode, setZoomMode] = useState<"fit" | number>("fit")
  const [fit, setFit] = useState(1)
  const [snapping, setSnapping] = useState(true)
  const [panning, setPanning] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const workspaceRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const anchor = useRef<{ page: { x: number; y: number }; client: { x: number; y: number } } | null>(null)


  const save = useSaveCertificateDesign()
  const upload = useUploadCertificateAsset()

  const zoom = zoomMode === "fit" ? fit : zoomMode
  const problems = useMemo(() => designProblems(design), [design])
  const target = parseFolder(folder.folder)

  const assets = useMemo(() => {
    const map = new Map<string, CanvasAsset>()

    for (const asset of library) map.set(asset.id, { url: assetUrl(asset.id), name: asset.name })

    return map
  }, [library])

  // A altura dos textos acompanha o exemplo escolhido: o texto de um convite é
  // mais longo que o de uma doação.
  const { refresh } = editor
  useEffect(() => {
    refresh()
  }, [fields, refresh])

  // Ajustar à tela acompanha o tamanho da mesa, inclusive ao abrir um painel.
  useEffect(() => {
    const workspace = workspaceRef.current

    if (!workspace || typeof ResizeObserver === "undefined") return

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setFit(Math.max(MIN_ZOOM, Math.min((width - PAD * 2) / W, (height - PAD * 2) / H)))
    })

    observer.observe(workspace)
    return () => observer.disconnect()
  }, [])

  const zoomTo = useCallback(
    (next: number, client?: { x: number; y: number }) => {
      const svg = svgRef.current
      const workspace = workspaceRef.current
      const at = client ?? (workspace ? { x: workspace.getBoundingClientRect().left + workspace.clientWidth / 2, y: workspace.getBoundingClientRect().top + workspace.clientHeight / 2 } : null)

      if (svg && at) {
        const rect = svg.getBoundingClientRect()
        anchor.current = { page: { x: (at.x - rect.left) / zoom, y: (at.y - rect.top) / zoom }, client: at }
      }

      setZoomMode(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(next * 100) / 100)))
    },
    [zoom],
  )

  // O ponto da página que estava debaixo do ponteiro continua debaixo dele
  // depois do zoom.
  useLayoutEffect(() => {
    const pending = anchor.current
    const svg = svgRef.current
    const workspace = workspaceRef.current
    anchor.current = null

    if (!pending || !svg || !workspace) return

    const rect = svg.getBoundingClientRect()
    workspace.scrollLeft += rect.left + pending.page.x * zoom - pending.client.x
    workspace.scrollTop += rect.top + pending.page.y * zoom - pending.client.y
  }, [zoom])

  useEffect(() => {
    const workspace = workspaceRef.current

    if (!workspace) return

    function onWheel(event: WheelEvent) {
      if (!event.ctrlKey && !event.metaKey) return

      event.preventDefault()
      zoomTo(zoom * Math.exp(-event.deltaY * 0.0025), { x: event.clientX, y: event.clientY })
    }

    workspace.addEventListener("wheel", onWheel, { passive: false })
    return () => workspace.removeEventListener("wheel", onWheel)
  }, [zoom, zoomTo])

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement))

    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])

  // Fechar a aba com alterações não salvas pede confirmação ao navegador.
  useEffect(() => {
    if (!editor.dirty) return

    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault()

    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [editor.dirty])

  const selected = design.elements.filter((element) => selection.includes(element.id))
  const texts = selected.filter((element) => element.type === "text")

  // Atalhos de teclado. Não valem enquanto a pessoa digita num campo: lá, a
  // seta move o cursor e o Ctrl+Z desfaz a digitação.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTyping(event.target)) return

      const mod = event.ctrlKey || event.metaKey
      const key = event.key.toLowerCase()
      const ids = selection

      if (event.key === " " && !(event.target as HTMLElement)?.closest?.("button, a")) {
        event.preventDefault()
        setPanning(true)
        return
      }

      if (mod && key === "z") {
        event.preventDefault()
        if (event.shiftKey) editor.redo()
        else editor.undo()
        return
      }

      if (mod && key === "y") {
        event.preventDefault()
        editor.redo()
        return
      }

      if (mod && (key === "=" || key === "+")) {
        event.preventDefault()
        zoomTo(zoom * 1.2)
        return
      }

      if (mod && key === "-") {
        event.preventDefault()
        zoomTo(zoom / 1.2)
        return
      }

      if (mod && key === "0") {
        event.preventDefault()
        setZoomMode("fit")
        return
      }

      if (mod && key === "a") {
        event.preventDefault()
        setSelection(design.elements.map((element) => element.id))
        return
      }

      if (mod && key === "v") {
        event.preventDefault()
        editor.paste()
        return
      }

      if (ids.length === 0) return

      if (event.key === "Escape") {
        setSelection([])
        return
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault()
        editor.remove(ids)
        return
      }

      if (event.key.startsWith("Arrow")) {
        event.preventDefault()
        const step = event.shiftKey ? 10 : 1
        const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0
        const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0
        editor.nudge(ids, dx, dy)
        return
      }

      if (event.key === "Enter" && ids.length === 1 && texts.length === 1 && !texts[0].locked) {
        event.preventDefault()
        setEditingId(texts[0].id)
        return
      }

      if (!mod) return

      const actions: Record<string, () => void> = {
        c: () => editor.copy(ids),
        x: () => editor.cut(ids),
        d: () => editor.duplicate(ids),
        l: () => editor.updateElements(ids, { locked: !selected.every((element) => element.locked) }),
        "]": () => editor.arrange(ids, event.shiftKey ? "front" : "forward"),
        "[": () => editor.arrange(ids, event.shiftKey ? "back" : "backward"),
        "}": () => editor.arrange(ids, "front"),
        "{": () => editor.arrange(ids, "back"),
      }

      if (texts.length > 0) {
        const textIds = texts.map((element) => element.id)
        const every = (property: "bold" | "italic" | "underline") => texts.every((element) => element.type === "text" && element[property])

        actions.b = () => editor.updateElements(textIds, { bold: !every("bold") })
        actions.i = () => editor.updateElements(textIds, { italic: !every("italic") })
        actions.u = () => editor.updateElements(textIds, { underline: !every("underline") })
      }

      const action = actions[key]

      if (action) {
        event.preventDefault()
        action()
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      if (event.key === " ") setPanning(false)
    }

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
    }
  }, [design.elements, editor, selected, selection, setSelection, texts, zoom, zoomTo])

  async function handleUpload(file: File): Promise<CertificateAsset | null> {
    return await upload.mutateAsync(file).catch(() => null)
  }

  async function handlePreview() {
    setPreviewError(null)
    setPreviewing(true)

    await openPdf(() => previewCertificate({ design, ...target, transaction_type: type }))
      .catch((error: unknown) => {
        setPreviewError(error instanceof CheckoutError ? error.message : "Não conseguimos gerar o PDF agora.")
      })
      .finally(() => setPreviewing(false))
  }

  async function handleSave(label: string) {
    const saved = await save.mutateAsync({ ...target, label, design }).catch(() => null)

    if (saved) {
      navigate(`${STUDIO}?pasta=${encodeURIComponent(folder.folder)}&salvo=${saved.version}`)
    }
  }

  const saveError = save.isError
    ? save.error instanceof CheckoutError
      ? save.error.message
      : "Não conseguimos falar com o servidor. O desenho continua aqui."
    : null

  function leave(event: ReactMouseEvent<HTMLAnchorElement>) {
    if (editor.dirty && !window.confirm("Sair do editor sem salvar? As alterações desta versão se perdem.")) {
      event.preventDefault()
    }
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen?.()
  }

  function onWorkspacePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget || (event.target as HTMLElement).dataset.mesa !== undefined) {
      setSelection([])
      setEditingId(null)
    }
  }

  const ids = selection
  const menuItems: MenuItem[] =
    ids.length === 0
      ? [{ label: "Colar", shortcut: `${MOD}+V`, onSelect: editor.paste, disabled: !editor.hasClipboard() }]
      : [
          ...(texts.length === 1 && ids.length === 1 ? [{ label: "Editar texto", shortcut: "Enter", onSelect: () => setEditingId(texts[0].id) }] : []),
          { label: "Recortar", shortcut: `${MOD}+X`, onSelect: () => editor.cut(ids) },
          { label: "Copiar", shortcut: `${MOD}+C`, onSelect: () => editor.copy(ids) },
          { label: "Colar", shortcut: `${MOD}+V`, onSelect: editor.paste, disabled: !editor.hasClipboard() },
          { label: "Duplicar", shortcut: `${MOD}+D`, onSelect: () => editor.duplicate(ids) },
          "separator",
          { label: "Trazer para a frente", shortcut: `${MOD}+Shift+]`, onSelect: () => editor.arrange(ids, "front") },
          { label: "Avançar uma camada", shortcut: `${MOD}+]`, onSelect: () => editor.arrange(ids, "forward") },
          { label: "Recuar uma camada", shortcut: `${MOD}+[`, onSelect: () => editor.arrange(ids, "backward") },
          { label: "Enviar para trás", shortcut: `${MOD}+Shift+[`, onSelect: () => editor.arrange(ids, "back") },
          "separator",
          {
            label: selected.every((element) => element.locked) ? "Destravar" : "Travar",
            shortcut: `${MOD}+L`,
            onSelect: () => editor.updateElements(ids, { locked: !selected.every((element) => element.locked) }),
          },
          { label: "Excluir", shortcut: "Delete", onSelect: () => editor.remove(ids), danger: true },
        ]

  const contentWidth = W * zoom + PAD * 2
  const contentHeight = H * zoom + PAD * 2

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-surface text-ink">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface px-2 sm:px-3">
        <Link
          to={`${STUDIO}?pasta=${encodeURIComponent(folder.folder)}`}
          onClick={leave}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-tile px-2 text-sm font-semibold hover:bg-surface-muted"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Estúdio</span>
        </Link>

        <div className="hidden min-w-0 items-center gap-2 border-l border-line pl-3 md:flex">
          {folder.scope !== "default" && <Badge tone={SCOPE_LABEL[folder.scope].tone}>{SCOPE_LABEL[folder.scope].label}</Badge>}
          <h1 className="min-w-0 truncate font-display text-sm font-bold" title={`${folder.title}, a partir de ${baseLabel}`}>
            {folder.title}
          </h1>
          <span className="shrink-0 text-xs text-ink-soft">versão {nextVersion}</span>
        </div>

        <div className="ml-auto flex items-center gap-0.5 xl:hidden">
          <ToolButton
            icon={PanelLeft}
            label="Painel de elementos"
            className="lg:hidden"
            pressed={panels.left}
            onClick={() => setPanels((current) => ({ left: !current.left, right: false }))}
          />
          <ToolButton icon={PanelRight} label="Propriedades" pressed={panels.right} onClick={() => setPanels((current) => ({ left: false, right: !current.right }))} />
        </div>

        <div className="flex items-center gap-0.5 border-line xl:ml-auto xl:border-r xl:pr-2">
          <ToolButton icon={Undo2} label="Desfazer" shortcut={`${MOD}+Z`} disabled={!editor.canUndo} onClick={editor.undo} />
          <ToolButton icon={Redo2} label="Refazer" shortcut={`${MOD}+Shift+Z`} disabled={!editor.canRedo} onClick={editor.redo} />
        </div>

        <div className="hidden items-center gap-0.5 border-r border-line pr-2 sm:flex">
          <ToolButton icon={ZoomOut} label="Diminuir o zoom" shortcut={`${MOD}+-`} onClick={() => zoomTo(zoom / 1.2)} />
          <button
            type="button"
            title={`Ajustar à tela (${MOD}+0)`}
            onClick={() => setZoomMode("fit")}
            className={cn("min-h-8 w-14 rounded-tile text-xs font-semibold tabular-nums hover:bg-surface-muted", zoomMode === "fit" && "text-partner-dark")}
          >
            {Math.round(zoom * 100)}%
            <span className="sr-only">: ajustar à tela</span>
          </button>
          <ToolButton icon={ZoomIn} label="Aumentar o zoom" shortcut={`${MOD}+=`} onClick={() => zoomTo(zoom * 1.2)} />
        </div>

        <div className="hidden items-center gap-1 xl:flex">
          <ToolButton icon={Magnet} label="Guias magnéticas" pressed={snapping} onClick={() => setSnapping((current) => !current)} />
          <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
            Exemplo
            <select
              value={type}
              onChange={(event) => setType(event.target.value as TransactionType)}
              className="h-8 rounded-tile border border-line bg-surface px-2 text-xs text-ink outline-none focus:border-ink"
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <ShortcutsButton />
        </div>

        <CheckButton problems={problems} design={design} assets={assets} onSelect={(id) => setSelection([id])} />

        <span className="hidden sm:contents">
          <ToolButton
            icon={previewing ? Loader2 : FileDown}
            label="Prévia em PDF"
            showLabel
            iconClassName={previewing ? "animate-spin" : undefined}
            disabled={previewing || problems.length > 0}
            onClick={handlePreview}
          />
        </span>
        {typeof document !== "undefined" && document.fullscreenEnabled && (
          <ToolButton icon={fullscreen ? Shrink : Expand} label={fullscreen ? "Sair da tela cheia" : "Tela cheia"} onClick={toggleFullscreen} />
        )}

        <SaveButton nextVersion={nextVersion} problems={problems.length} saving={save.isPending} error={saveError} onSave={handleSave} />
      </header>

      {previewError && (
        <p role="alert" className="border-b border-line bg-primary-soft px-4 py-2 text-sm font-semibold text-primary">
          {previewError}
        </p>
      )}

      <div className="relative flex min-h-0 flex-1">
        <aside
          aria-label="Elementos, imagens, camadas e tema"
          className={cn(
            "z-20 h-full shrink-0 border-r border-line bg-surface",
            panels.left ? "absolute inset-y-0 left-0 shadow-xl" : "hidden",
            "lg:static lg:block lg:shadow-none",
          )}
        >
          <EditorSidePanel
            editor={editor}
            tab={tab}
            onTab={setTab}
            library={library}
            assets={assets}
            uploading={upload.isPending}
            uploadError={upload.isError ? (upload.error instanceof CheckoutError ? upload.error.message : "A imagem não foi enviada. Tente de novo.") : null}
            onUpload={handleUpload}
          />
        </aside>

        <div ref={workspaceRef} onPointerDown={onWorkspacePointerDown} className="relative min-w-0 flex-1 overflow-auto bg-line">
          <div
            data-mesa=""
            className="flex items-center justify-center"
            style={{ minWidth: "100%", minHeight: "100%", width: contentWidth, height: contentHeight }}
          >
            <EditorCanvas
              editor={editor}
              fields={fields}
              assets={assets}
              zoom={zoom}
              snapping={snapping}
              panning={panning}
              editingId={editingId}
              onEditText={setEditingId}
              onContextMenu={setMenu}
              workspaceRef={workspaceRef}
              svgRef={svgRef}
            />
          </div>
        </div>

        <aside
          aria-label="Propriedades"
          className={cn(
            "z-20 h-full w-72 shrink-0 overflow-y-auto border-l border-line bg-surface",
            panels.right ? "absolute inset-y-0 right-0 shadow-xl" : "hidden",
            "xl:static xl:block xl:shadow-none",
          )}
        >
          <EditorInspector editor={editor} library={library} assets={assets} />
        </aside>
      </div>

      {menu && <EditorContextMenu position={menu} items={menuItems} onClose={() => setMenu(null)} />}
    </div>
  )
}

// O editor de uma pasta, em tela própria, sem o menu do painel: a página do
// certificado precisa de espaço. Abre a partir da versão atual da pasta, ou da
// versão pedida no `base`, ou do modelo padrão quando a pasta ainda não tem
// nenhuma, e salva sempre como a versão seguinte.
export default function CertificateEditorPage() {
  const [params] = useSearchParams()
  const folderKey = params.get("pasta") ?? "default"
  const baseId = params.get("base")

  const folders = useCertificateFolders()
  const designs = useCertificateDesigns(folderKey)
  const defaults = useCertificateDesigns("default")
  const library = useCertificateAssets()

  const folder = folders.data?.folders.find((item) => item.folder === folderKey) ?? null
  const loading = folders.isPending || designs.isPending || defaults.isPending || library.isPending
  const failed = folders.isError || designs.isError || defaults.isError || library.isError

  const base = designs.data?.find((version) => version.id === baseId) ?? designs.data?.[0] ?? null
  const fallback = folderKey === "default" ? null : (defaults.data?.[0] ?? null)
  const start = base ?? fallback
  const baseLabel = start ? `versão ${start.version}, "${start.label}"${base ? "" : ", do modelo padrão"}` : "o modelo de fábrica"

  if (loading) {
    return (
      <div className="flex h-dvh flex-col">
        <div className="h-14 border-b border-line" />
        <div className="flex flex-1 items-center justify-center bg-line p-12">
          <Skeleton className="aspect-[842/595] w-full max-w-4xl" />
        </div>
      </div>
    )
  }

  if (failed || !folder || !designs.data || !library.data || !folders.data) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {failed ? (
            <StateMessage
              tone="error"
              title="O editor não carregou"
              description="Não conseguimos buscar a pasta, as versões ou a biblioteca de imagens agora."
              action={
                <button
                  type="button"
                  onClick={() => {
                    folders.refetch()
                    designs.refetch()
                    defaults.refetch()
                    library.refetch()
                  }}
                  className="font-display font-bold text-primary underline underline-offset-4"
                >
                  Tentar de novo
                </button>
              }
            />
          ) : (
            <StateMessage
              title="Pasta não encontrada"
              description="Esta pasta não existe mais ou o endereço está incompleto."
              action={
                <ButtonLink to={STUDIO} size="sm">
                  Ver as pastas
                </ButtonLink>
              }
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <Editor
      key={`${folder.folder}-${start?.id ?? "fabrica"}`}
      folder={folder}
      initial={start?.design ?? folders.data.factory}
      baseLabel={baseLabel}
      nextVersion={(designs.data[0]?.version ?? 0) + 1}
      library={library.data}
    />
  )
}
