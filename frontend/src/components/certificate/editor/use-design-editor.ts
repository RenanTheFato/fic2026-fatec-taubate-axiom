import { useCallback, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react"
import { CERTIFICATE_PAGE } from "../../../types/certificate-types"
import type { CertificateDesign, CertificateElement } from "../../../types/certificate-types"
import { newElementId } from "../certificate-design"
import { elementBounds, round, unionBounds, withTextHeight } from "./editor-geometry"

// O estado do editor: o desenho com o histórico de desfazer, a seleção e as
// ações que um editor de slides tem (duplicar, copiar e colar, trazer para a
// frente, alinhar, distribuir, travar). Um arrasto inteiro é um passo só no
// histórico, e digitar num campo também: várias teclas seguidas no mesmo
// campo viram uma alteração, e não uma por letra.

type History = {
  past: CertificateDesign[]
  present: CertificateDesign
  future: CertificateDesign[]
  coalesce: string | null
  coalesceAt: number
  gestureBase: CertificateDesign | null
  gestureDirty: boolean
}

type Update = (design: CertificateDesign) => CertificateDesign

type Action =
  | { type: "commit"; update: Update; coalesce?: string; at: number }
  | { type: "gesture-start" }
  | { type: "gesture-update"; update: Update }
  | { type: "gesture-end" }
  | { type: "refresh"; update: Update }
  | { type: "undo" }
  | { type: "redo" }

const LIMIT = 100
const COALESCE_WINDOW = 1200

function reducer(state: History, action: Action): History {
  switch (action.type) {
    case "commit": {
      const next = action.update(state.present)

      if (next === state.present) return state

      if (action.coalesce && state.coalesce === action.coalesce && action.at - state.coalesceAt < COALESCE_WINDOW) {
        return { ...state, present: next, future: [], coalesceAt: action.at }
      }

      return {
        ...state,
        past: [...state.past, state.present].slice(-LIMIT),
        present: next,
        future: [],
        coalesce: action.coalesce ?? null,
        coalesceAt: action.at,
      }
    }
    case "gesture-start":
      return { ...state, gestureBase: state.present, gestureDirty: false, coalesce: null }
    case "gesture-update": {
      const next = action.update(state.present)

      if (next === state.present) return state

      return {
        ...state,
        past: !state.gestureDirty && state.gestureBase ? [...state.past, state.gestureBase].slice(-LIMIT) : state.past,
        present: next,
        future: [],
        gestureDirty: true,
      }
    }
    case "gesture-end":
      return { ...state, gestureBase: null, gestureDirty: false }
    case "refresh":
      return { ...state, present: action.update(state.present) }
    case "undo": {
      const previous = state.past[state.past.length - 1]

      if (!previous) return state

      return { ...state, past: state.past.slice(0, -1), present: previous, future: [state.present, ...state.future], coalesce: null }
    }
    case "redo": {
      const [next, ...rest] = state.future

      if (!next) return state

      return { ...state, past: [...state.past, state.present], present: next, future: rest, coalesce: null }
    }
  }
}

export type AlignEdge = "left" | "hcenter" | "right" | "top" | "vcenter" | "bottom"

const { width: W, height: H } = CERTIFICATE_PAGE
const PASTE_OFFSET = 12

export function useDesignEditor(initial: CertificateDesign, fields: Record<string, string>) {
  const [history, dispatch] = useReducer(reducer, initial, (design): History => ({
    past: [],
    present: design,
    future: [],
    coalesce: null,
    coalesceAt: 0,
    gestureBase: null,
    gestureDirty: false,
  }))
  const [selection, setSelection] = useState<string[]>([])
  const clipboard = useRef<CertificateElement[]>([])
  const pastes = useRef(0)
  const fieldsRef = useRef(fields)

  useLayoutEffect(() => {
    fieldsRef.current = fields
  }, [fields])

  const design = history.present

  // Todo texto alterado tem a altura recalculada pelas linhas que ele ocupa.
  const settle = useCallback((next: CertificateDesign): CertificateDesign => {
    let changed = false
    const elements = next.elements.map((element) => {
      const settled = withTextHeight(element, fieldsRef.current)
      if (settled !== element) changed = true
      return settled
    })

    return changed ? { ...next, elements } : next
  }, [])

  const commit = useCallback(
    (update: Update, coalesce?: string) => dispatch({ type: "commit", update: (current) => settle(update(current)), coalesce, at: Date.now() }),
    [settle],
  )

  const gesture = useMemo(
    () => ({
      start: () => dispatch({ type: "gesture-start" }),
      update: (update: Update) => dispatch({ type: "gesture-update", update: (current) => settle(update(current)) }),
      end: () => dispatch({ type: "gesture-end" }),
    }),
    [settle],
  )

  const refresh = useCallback(() => dispatch({ type: "refresh", update: settle }), [settle])

  const updateElements = useCallback(
    (ids: string[], change: Partial<CertificateElement> | ((element: CertificateElement) => CertificateElement), coalesce?: string) => {
      commit(
        (current) => ({
          ...current,
          elements: current.elements.map((element) =>
            ids.includes(element.id) ? (typeof change === "function" ? change(element) : ({ ...element, ...change } as CertificateElement)) : element,
          ),
        }),
        coalesce,
      )
    },
    [commit],
  )

  const add = useCallback(
    (elements: CertificateElement[]) => {
      commit((current) => ({ ...current, elements: [...current.elements, ...elements] }))
      setSelection(elements.map((element) => element.id))
    },
    [commit],
  )

  const remove = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return

      commit((current) => ({ ...current, elements: current.elements.filter((element) => !ids.includes(element.id)) }))
      setSelection((current) => current.filter((id) => !ids.includes(id)))
    },
    [commit],
  )

  // Cópia ganha identificador novo e sai um pouco deslocada, para não sumir em
  // cima do original. O QR não se duplica: o certificado leva um só.
  const cloneAll = useCallback((elements: CertificateElement[], offset: number) => {
    return elements
      .filter((element) => element.type !== "qr")
      .map((element) => ({
        ...element,
        id: newElementId(element.type === "shape" ? "forma" : element.type === "image" ? "imagem" : element.type === "text" ? "texto" : element.type),
        x: round(element.x + offset),
        y: round(element.y + offset),
        locked: false,
      }))
  }, [])

  const selected = useCallback((ids: string[]) => design.elements.filter((element) => ids.includes(element.id)), [design.elements])

  const duplicate = useCallback((ids: string[]) => add(cloneAll(selected(ids), PASTE_OFFSET)), [add, cloneAll, selected])

  const copy = useCallback(
    (ids: string[]) => {
      clipboard.current = selected(ids)
      pastes.current = 0
    },
    [selected],
  )

  const cut = useCallback(
    (ids: string[]) => {
      copy(ids)
      remove(ids)
    },
    [copy, remove],
  )

  const paste = useCallback(() => {
    if (clipboard.current.length === 0) return

    pastes.current += 1
    add(cloneAll(clipboard.current, PASTE_OFFSET * pastes.current))
  }, [add, cloneAll])

  // Ordem das camadas: o fim da lista é a frente.
  const arrange = useCallback(
    (ids: string[], to: "front" | "forward" | "backward" | "back") => {
      commit((current) => {
        const moving = current.elements.filter((element) => ids.includes(element.id))
        const rest = current.elements.filter((element) => !ids.includes(element.id))

        if (moving.length === 0) return current
        if (to === "front") return { ...current, elements: [...rest, ...moving] }
        if (to === "back") return { ...current, elements: [...moving, ...rest] }

        const elements = [...current.elements]
        const order = to === "forward" ? [...elements.keys()].reverse() : [...elements.keys()]

        for (const index of order) {
          if (!ids.includes(elements[index].id)) continue

          const target = to === "forward" ? index + 1 : index - 1

          if (target < 0 || target >= elements.length || ids.includes(elements[target].id)) continue

          const swapped = elements[target]
          elements[target] = elements[index]
          elements[index] = swapped
        }

        return { ...current, elements }
      })
    },
    [commit],
  )

  const moveLayer = useCallback(
    (id: string, toIndex: number) => {
      commit((current) => {
        const from = current.elements.findIndex((element) => element.id === id)

        if (from < 0 || from === toIndex) return current

        const elements = [...current.elements]
        const [item] = elements.splice(from, 1)
        elements.splice(Math.max(0, Math.min(toIndex, elements.length)), 0, item)

        return { ...current, elements }
      })
    },
    [commit],
  )

  // Um elemento só se alinha à página; vários se alinham entre si.
  const align = useCallback(
    (ids: string[], edge: AlignEdge) => {
      commit((current) => {
        const targets = current.elements.filter((element) => ids.includes(element.id) && !element.locked)
        const frame = targets.length > 1 ? unionBounds(targets) : { x: 0, y: 0, width: W, height: H }

        if (!frame || targets.length === 0) return current

        return {
          ...current,
          elements: current.elements.map((element) => {
            if (!targets.includes(element)) return element

            const bounds = elementBounds(element)
            let dx = 0
            let dy = 0

            if (edge === "left") dx = frame.x - bounds.x
            if (edge === "hcenter") dx = frame.x + frame.width / 2 - (bounds.x + bounds.width / 2)
            if (edge === "right") dx = frame.x + frame.width - (bounds.x + bounds.width)
            if (edge === "top") dy = frame.y - bounds.y
            if (edge === "vcenter") dy = frame.y + frame.height / 2 - (bounds.y + bounds.height / 2)
            if (edge === "bottom") dy = frame.y + frame.height - (bounds.y + bounds.height)

            return { ...element, x: round(element.x + dx), y: round(element.y + dy) }
          }),
        }
      })
    },
    [commit],
  )

  // Distribuir deixa o mesmo espaço entre os elementos, do primeiro ao último.
  const distribute = useCallback(
    (ids: string[], axis: "x" | "y") => {
      commit((current) => {
        const targets = current.elements.filter((element) => ids.includes(element.id) && !element.locked)

        if (targets.length < 3) return current

        const measured = targets
          .map((element) => ({ element, bounds: elementBounds(element) }))
          .sort((left, right) => (axis === "x" ? left.bounds.x - right.bounds.x : left.bounds.y - right.bounds.y))
        const first = measured[0].bounds
        const last = measured[measured.length - 1].bounds
        const span = axis === "x" ? last.x + last.width - first.x : last.y + last.height - first.y
        const occupied = measured.reduce((total, item) => total + (axis === "x" ? item.bounds.width : item.bounds.height), 0)
        const gap = (span - occupied) / (measured.length - 1)

        let cursor = axis === "x" ? first.x : first.y
        const moved = new Map<string, CertificateElement>()

        for (const item of measured) {
          const delta = cursor - (axis === "x" ? item.bounds.x : item.bounds.y)
          moved.set(item.element.id, {
            ...item.element,
            x: axis === "x" ? round(item.element.x + delta) : item.element.x,
            y: axis === "y" ? round(item.element.y + delta) : item.element.y,
          })
          cursor += (axis === "x" ? item.bounds.width : item.bounds.height) + gap
        }

        return { ...current, elements: current.elements.map((element) => moved.get(element.id) ?? element) }
      })
    },
    [commit],
  )

  const nudge = useCallback(
    (ids: string[], dx: number, dy: number) => {
      updateElements(
        ids,
        (element) => (element.locked ? element : { ...element, x: round(element.x + dx), y: round(element.y + dy) }),
        `nudge:${ids.join(",")}`,
      )
    },
    [updateElements],
  )

  return {
    design,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    dirty: history.past.length > 0,
    undo: () => dispatch({ type: "undo" }),
    redo: () => dispatch({ type: "redo" }),
    selection,
    setSelection,
    commit,
    gesture,
    refresh,
    updateElements,
    add,
    remove,
    duplicate,
    copy,
    cut,
    paste,
    hasClipboard: () => clipboard.current.length > 0,
    arrange,
    moveLayer,
    align,
    distribute,
    nudge,
  }
}

export type DesignEditor = ReturnType<typeof useDesignEditor>
