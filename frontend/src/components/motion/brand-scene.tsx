import { useEffect, useRef } from "react"
import * as THREE from "three"

export type SceneVariant = "network" | "symbol" | "drift"

type BrandSceneProps = {
  variant: SceneVariant
  className?: string
  onFallback?: () => void
}

// Cenas decorativas em three.js. Este arquivo só existe fora do pacote inicial:
// quem o importa usa React.lazy, então o three só é baixado por quem tem
// aparelho para rodá-lo — e, uma vez baixado, todas as cenas do site saem do
// mesmo pedaço. Cena nova entra como `variant` daqui, nunca em arquivo novo.
//
// Regras de custo, iguais para toda cena: só pontos e linhas (nada de malha,
// luz ou sombra), DPR no teto de 1.5, "low-power", laço parado fora da tela e
// na aba em segundo plano, e um vigia que desliga a cena de vez se o orçamento
// de quadro não for cumprido.

const TEAL = 0x00dece
const MAGENTA = 0xbb2dd7
const YELLOW = 0xffdc00

// Cada canvas é um contexto WebGL, e contexto WebGL é o recurso caro da página.
// Três cenas simultâneas é o teto: a quarta que aparecer cai no fundo estático
// em vez de disputar GPU com as outras.
const MAX_LIVE_SCENES = 3
let liveScenes = 0

type Pointer = { x: number; y: number }

type Built = {
  object: THREE.Object3D
  update: (elapsed: number, delta: number, pointer: Pointer) => void
  dispose: () => void
}

function fibonacciSphere(count: number, radius: number): Float32Array {
  const positions = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    // Espiral de Fibonacci: distribui os pontos sem agrupá-los nos polos, que é
    // o defeito visível de sortear ângulos ao acaso.
    const y = 1 - (i / (count - 1)) * 2
    const ring = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = i * 2.399963

    positions[i * 3] = Math.cos(theta) * ring * radius
    positions[i * 3 + 1] = y * radius
    positions[i * 3 + 2] = Math.sin(theta) * ring * radius
  }

  return positions
}

// ---------------------------------------------------------------------------
// network — a rede de pontos ligados do topo, literalmente o que o site da ONG
// chama de "essa rede que constrói inclusão". Segue o ponteiro de leve.
// ---------------------------------------------------------------------------
function buildNetwork(): Built {
  const COUNT = 90
  const LINK = 1.15
  const positions = fibonacciSphere(COUNT, 3.2)
  const segments: number[] = []

  for (let i = 0; i < COUNT; i++) {
    for (let j = i + 1; j < COUNT; j++) {
      const dx = positions[i * 3] - positions[j * 3]
      const dy = positions[i * 3 + 1] - positions[j * 3 + 1]
      const dz = positions[i * 3 + 2] - positions[j * 3 + 2]

      if (dx * dx + dy * dy + dz * dz > LINK * LINK) continue

      segments.push(
        positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
        positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2],
      )
    }
  }

  const pointGeometry = new THREE.BufferGeometry()
  pointGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  const pointMaterial = new THREE.PointsMaterial({
    color: new THREE.Color(MAGENTA),
    size: 0.15,
    transparent: true,
    opacity: 0.9,
  })

  const lineGeometry = new THREE.BufferGeometry()
  lineGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(segments), 3))
  const lineMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color(TEAL),
    transparent: true,
    opacity: 0.45,
  })

  const group = new THREE.Group()
  group.add(new THREE.Points(pointGeometry, pointMaterial))
  group.add(new THREE.LineSegments(lineGeometry, lineMaterial))
  group.rotation.x = 0.4

  return {
    object: group,
    update: (elapsed, delta, pointer) => {
      group.rotation.y += delta * 0.12
      // Aproximação suave do alvo: sem isso, o giro salta a cada evento de
      // ponteiro em vez de acompanhar a mão.
      const targetX = 0.4 + Math.sin(elapsed / 6) * 0.1 + pointer.y * 0.25
      group.rotation.x += (targetX - group.rotation.x) * Math.min(delta * 3, 1)
      group.position.x += (pointer.x * 0.5 - group.position.x) * Math.min(delta * 3, 1)
    },
    dispose: () => {
      pointGeometry.dispose()
      lineGeometry.dispose()
      pointMaterial.dispose()
      lineMaterial.dispose()
    },
  }
}

// ---------------------------------------------------------------------------
// symbol — o símbolo da marca se formando a partir de partículas espalhadas.
// Os pontos e as cores saem de uma leitura do próprio `public/simbolo.png`, e
// não de coordenadas copiadas à mão: se a ONG trocar o arquivo, a cena troca
// junto. É a cena mais cara do projeto, e mesmo assim custa uma decodificação
// de imagem no mount e um passe de interpolação por quadro durante 2 segundos.
// ---------------------------------------------------------------------------
const SYMBOL_MAX_POINTS = 1800
const SYMBOL_SAMPLE_HEIGHT = 132
const SYMBOL_WORLD_HEIGHT = 6.4
const SYMBOL_ASSEMBLY_SECONDS = 2.2

function buildSymbol(): Built {
  const positions = new Float32Array(SYMBOL_MAX_POINTS * 3)
  const scattered = fibonacciSphere(SYMBOL_MAX_POINTS, 7)
  const targets = new Float32Array(SYMBOL_MAX_POINTS * 3)
  const colors = new Float32Array(SYMBOL_MAX_POINTS * 3)

  positions.set(scattered)

  const geometry = new THREE.BufferGeometry()
  const positionAttribute = new THREE.BufferAttribute(positions, 3)
  geometry.setAttribute("position", positionAttribute)
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))
  geometry.setDrawRange(0, 0)

  const material = new THREE.PointsMaterial({
    size: 0.075,
    transparent: true,
    opacity: 0.95,
    vertexColors: true,
  })

  const points = new THREE.Points(geometry, material)
  let ready = false
  let elapsedSinceReady = 0
  let cancelled = false

  const image = new Image()
  image.decoding = "async"
  image.src = "/simbolo.png"

  image
    .decode()
    .then(() => {
      if (cancelled) return

      const height = SYMBOL_SAMPLE_HEIGHT
      const width = Math.round((image.naturalWidth / image.naturalHeight) * height)
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height

      const context = canvas.getContext("2d", { willReadFrequently: false })
      if (!context) return

      context.drawImage(image, 0, 0, width, height)
      const { data } = context.getImageData(0, 0, width, height)

      const opaque: number[] = []
      for (let i = 0; i < width * height; i++) {
        if (data[i * 4 + 3] > 150) opaque.push(i)
      }

      const stride = Math.max(1, Math.ceil(opaque.length / SYMBOL_MAX_POINTS))
      const scale = SYMBOL_WORLD_HEIGHT / height
      let written = 0

      for (let i = 0; i < opaque.length && written < SYMBOL_MAX_POINTS; i += stride) {
        const index = opaque[i]
        const x = index % width
        const y = Math.floor(index / width)

        targets[written * 3] = (x - width / 2) * scale
        targets[written * 3 + 1] = -(y - height / 2) * scale
        targets[written * 3 + 2] = (Math.random() - 0.5) * 0.3

        colors[written * 3] = data[index * 4] / 255
        colors[written * 3 + 1] = data[index * 4 + 1] / 255
        colors[written * 3 + 2] = data[index * 4 + 2] / 255

        written++
      }

      geometry.setDrawRange(0, written)
      geometry.attributes.color.needsUpdate = true
      ready = true
    })
    .catch(() => {
      // Imagem indisponível: a cena simplesmente não desenha nada e a seção
      // fica com o fundo que já tem.
    })

  return {
    object: points,
    update: (elapsed, delta, pointer) => {
      if (ready && elapsedSinceReady < SYMBOL_ASSEMBLY_SECONDS) {
        elapsedSinceReady = Math.min(elapsedSinceReady + delta, SYMBOL_ASSEMBLY_SECONDS)

        const t = elapsedSinceReady / SYMBOL_ASSEMBLY_SECONDS
        const eased = 1 - Math.pow(1 - t, 3)
        const count = geometry.drawRange.count

        for (let i = 0; i < count * 3; i++) {
          positions[i] = scattered[i] + (targets[i] - scattered[i]) * eased
        }

        positionAttribute.needsUpdate = true
      }

      points.rotation.y = Math.sin(elapsed / 5) * 0.22 + pointer.x * 0.3
      points.rotation.x = pointer.y * -0.18
    },
    dispose: () => {
      cancelled = true
      geometry.dispose()
      material.dispose()
    },
  }
}

// ---------------------------------------------------------------------------
// drift — poeira lenta nas três cores da marca. Sem linhas e sem cálculo por
// quadro além de um deslocamento: é a cena mais barata do projeto, e por isso é
// a que pode cobrir uma faixa inteira.
// ---------------------------------------------------------------------------
function buildDrift(): Built {
  const COUNT = 140
  const positions = new Float32Array(COUNT * 3)
  const colors = new Float32Array(COUNT * 3)
  const speeds = new Float32Array(COUNT)
  const palette = [new THREE.Color(TEAL), new THREE.Color(MAGENTA), new THREE.Color(YELLOW)]

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 16
    positions[i * 3 + 1] = (Math.random() - 0.5) * 9
    positions[i * 3 + 2] = (Math.random() - 0.5) * 4

    const color = palette[i % palette.length]
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b

    speeds[i] = 0.12 + Math.random() * 0.28
  }

  const geometry = new THREE.BufferGeometry()
  const attribute = new THREE.BufferAttribute(positions, 3)
  geometry.setAttribute("position", attribute)
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))

  const material = new THREE.PointsMaterial({
    size: 0.11,
    transparent: true,
    opacity: 0.75,
    vertexColors: true,
  })

  const points = new THREE.Points(geometry, material)

  return {
    object: points,
    update: (_elapsed, delta, pointer) => {
      for (let i = 0; i < COUNT; i++) {
        positions[i * 3 + 1] += speeds[i] * delta

        if (positions[i * 3 + 1] > 4.5) {
          positions[i * 3 + 1] = -4.5
          positions[i * 3] = (Math.random() - 0.5) * 16
        }
      }

      attribute.needsUpdate = true
      points.rotation.z = pointer.x * 0.08
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
    },
  }
}

const BUILDERS: Record<SceneVariant, () => Built> = {
  network: buildNetwork,
  symbol: buildSymbol,
  drift: buildDrift,
}

const CAMERA_DISTANCE: Record<SceneVariant, number> = {
  network: 9,
  symbol: 9,
  drift: 11,
}

export default function BrandScene({ variant, className, onFallback }: BrandSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const fallbackRef = useRef(onFallback)

  useEffect(() => {
    fallbackRef.current = onFallback
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    if (liveScenes >= MAX_LIVE_SCENES) {
      fallbackRef.current?.()
      return
    }

    liveScenes++

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.z = CAMERA_DISTANCE[variant]

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setClearAlpha(0)
    renderer.domElement.style.width = "100%"
    renderer.domElement.style.height = "100%"
    renderer.domElement.style.display = "block"
    container.appendChild(renderer.domElement)

    const built = BUILDERS[variant]()
    scene.add(built.object)

    // O ponteiro é lido da janela inteira, e não do canvas: as cenas ficam atrás
    // do conteúdo, com `pointer-events: none`, então nunca receberiam o evento.
    const pointer: Pointer = { x: 0, y: 0 }
    const finePointer = window.matchMedia("(pointer: fine)").matches

    function onPointerMove(event: PointerEvent) {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1
    }

    let frame = 0
    let running = false
    let stopped = false
    let visible = document.visibilityState === "visible"
    let onScreen = false
    let lastTime = performance.now()
    let sampleStart = lastTime
    let sampledFrames = 0

    function resize() {
      const { clientWidth, clientHeight } = container!
      if (clientWidth === 0 || clientHeight === 0) return

      renderer.setSize(clientWidth, clientHeight, false)
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
    }

    function stop() {
      running = false
      if (frame) cancelAnimationFrame(frame)
      frame = 0
    }

    function tick(now: number) {
      const delta = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now

      built.update(now / 1000, delta, pointer)
      renderer.render(scene, camera)

      // Vigia de quadro: se a média dos primeiros 2,5s não fechar 30fps, a cena
      // sai e o fundo estático assume. Enfeite não trava a página.
      sampledFrames++
      if (now - sampleStart > 2500) {
        const fps = (sampledFrames * 1000) / (now - sampleStart)

        if (fps < 30) {
          stopped = true
          stop()
          fallbackRef.current?.()
          return
        }

        sampleStart = now
        sampledFrames = 0
      }

      frame = requestAnimationFrame(tick)
    }

    function sync() {
      if (stopped) return

      if (visible && onScreen && !running) {
        running = true
        lastTime = performance.now()
        sampleStart = lastTime
        sampledFrames = 0
        frame = requestAnimationFrame(tick)
        return
      }

      if ((!visible || !onScreen) && running) stop()
    }

    const onVisibility = () => {
      visible = document.visibilityState === "visible"
      sync()
    }

    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      sync()
    })

    const resizeObserver = new ResizeObserver(resize)

    resize()
    observer.observe(container)
    resizeObserver.observe(container)
    document.addEventListener("visibilitychange", onVisibility)
    if (finePointer) window.addEventListener("pointermove", onPointerMove, { passive: true })

    return () => {
      stop()
      liveScenes--
      observer.disconnect()
      resizeObserver.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("pointermove", onPointerMove)
      built.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [variant])

  return <div ref={containerRef} className={className} aria-hidden="true" />
}
