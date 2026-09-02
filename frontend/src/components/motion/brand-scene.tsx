import { useEffect, useRef } from "react"
import * as THREE from "three"

export type SceneVariant = "network" | "symbol" | "drift" | "chain" | "archive" | "care"

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
// de quadro não for cumprido. Como as cenas agora também rodam em celular, cada
// construtor recebe `dense` e corta a contagem de partículas em tela pequena.

const TEAL = 0x00dece
const MAGENTA = 0xbb2dd7
const YELLOW = 0xffdc00

// Cada canvas é um contexto WebGL, e contexto WebGL é o recurso caro da página.
// Três cenas simultâneas é o teto: a quarta que aparecer cai no fundo estático
// em vez de disputar GPU com as outras.
const MAX_LIVE_SCENES = 3
let liveScenes = 0

type Pointer = { x: number; y: number }

type BuildContext = {
  /** Tela grande. Em celular cada cena usa menos partículas — e menos luxo. */
  dense: boolean
}

type Built = {
  object: THREE.Object3D
  update: (elapsed: number, delta: number, pointer: Pointer) => void
  /** Extensão visível em unidades de mundo, sempre que o container muda de tamanho. */
  resize?: (halfWidth: number, halfHeight: number) => void
  dispose: () => void
}

// Meia-extensão que a cena ocupa no mundo. A câmera se afasta o suficiente para
// caber isso na vertical E na horizontal, seja qual for o formato do container —
// é o que faz a mesma cena funcionar no quadrado do desktop e na tira larga e
// baixa do celular, sem cortar nada.
type Fit = { halfWidth: number; halfHeight: number }

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
function buildNetwork({ dense }: BuildContext): Built {
  const COUNT = dense ? 90 : 54
  const LINK = dense ? 1.15 : 1.4
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
// junto.
// ---------------------------------------------------------------------------
const SYMBOL_SAMPLE_HEIGHT = 132
const SYMBOL_WORLD_HEIGHT = 6.4
const SYMBOL_ASSEMBLY_SECONDS = 2.2

function buildSymbol({ dense }: BuildContext): Built {
  const maxPoints = dense ? 1800 : 900
  const positions = new Float32Array(maxPoints * 3)
  const scattered = fibonacciSphere(maxPoints, 7)
  const targets = new Float32Array(maxPoints * 3)
  const colors = new Float32Array(maxPoints * 3)

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

      const stride = Math.max(1, Math.ceil(opaque.length / maxPoints))
      const scale = SYMBOL_WORLD_HEIGHT / height
      let written = 0

      for (let i = 0; i < opaque.length && written < maxPoints; i += stride) {
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
function buildDrift({ dense }: BuildContext): Built {
  const COUNT = dense ? 140 : 70
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

// ---------------------------------------------------------------------------
// chain — a corrente de blocos da página de verificação, desenhada em pontos.
// Os cubos são fixos: não giram, não pulsam, não seguem o ponteiro. A única
// coisa que se move é o dado atravessando a corrente — cometas de pontos que
// saem de um bloco e chegam no seguinte, e o bloco que recebe o dado muda de
// cor enquanto ele passa. Paleta escura, para o desenho aparecer sobre o fundo
// claro do banner.
// ---------------------------------------------------------------------------
const CHAIN_INK = new THREE.Color(0x5c6260)
const CHAIN_ACTIVE = new THREE.Color(0x9a1fb3)
const CHAIN_LINK = new THREE.Color(0x9aa2a0)
const CHAIN_DATA = new THREE.Color(0x0a7a73)

const CUBE_EDGES: [number, number][] = [
  [0, 1], [1, 3], [3, 2], [2, 0],
  [4, 5], [5, 7], [7, 6], [6, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
]

// Os oito cantos do cubo, já girados: como nada gira em cena, a orientação
// precisa vir pronta e mostrar três faces, senão o cubo lê como quadrado.
function cubeCorners(size: number): THREE.Vector3[] {
  const half = size / 2
  const rotation = new THREE.Euler(0.32, 0.62, 0)
  const corners: THREE.Vector3[] = []

  for (let i = 0; i < 8; i++) {
    corners.push(new THREE.Vector3(
      (i & 1 ? 1 : -1) * half,
      (i & 2 ? 1 : -1) * half,
      (i & 4 ? 1 : -1) * half,
    ).applyEuler(rotation))
  }

  return corners
}

// Pontos distribuídos ao longo das doze arestas.
function cubePoints(size: number, samples: number): Float32Array {
  const corners = cubeCorners(size)
  const points = new Float32Array(CUBE_EDGES.length * samples * 3)
  let cursor = 0

  for (const [from, to] of CUBE_EDGES) {
    const start = corners[from]
    const end = corners[to]

    for (let i = 0; i < samples; i++) {
      const t = i / (samples - 1)
      points[cursor++] = start.x + (end.x - start.x) * t
      points[cursor++] = start.y + (end.y - start.y) * t
      points[cursor++] = start.z + (end.z - start.z) * t
    }
  }

  return points
}

// As mesmas doze arestas, agora como segmentos de linha: é o desenho do bloco,
// que o pontilhado sozinho não fecha.
function cubeEdges(size: number): Float32Array {
  const corners = cubeCorners(size)
  const values = new Float32Array(CUBE_EDGES.length * 6)
  let cursor = 0

  for (const [from, to] of CUBE_EDGES) {
    values[cursor++] = corners[from].x
    values[cursor++] = corners[from].y
    values[cursor++] = corners[from].z
    values[cursor++] = corners[to].x
    values[cursor++] = corners[to].y
    values[cursor++] = corners[to].z
  }

  return values
}

function buildChain({ dense }: BuildContext): Built {
  const COUNT = 5
  const GAP = 3.1
  const EDGE_SAMPLES = dense ? 9 : 6
  const CORE_SAMPLES = dense ? 5 : 4

  const centers: number[] = []

  for (let i = 0; i < COUNT; i++) {
    centers.push(
      (i - (COUNT - 1) / 2) * GAP,
      Math.sin(i * 1.1) * 0.5,
      Math.cos(i * 0.9) * 0.55,
    )
  }

  const shell = cubePoints(1.5, EDGE_SAMPLES)
  const core = cubePoints(0.6, CORE_SAMPLES)
  const perCube = shell.length / 3 + core.length / 3

  const blockPositions = new Float32Array(COUNT * perCube * 3)
  const blockColors = new Float32Array(COUNT * perCube * 3)

  for (let i = 0; i < COUNT; i++) {
    const offset = i * perCube * 3

    for (let v = 0; v < shell.length; v += 3) {
      blockPositions[offset + v] = shell[v] + centers[i * 3]
      blockPositions[offset + v + 1] = shell[v + 1] + centers[i * 3 + 1]
      blockPositions[offset + v + 2] = shell[v + 2] + centers[i * 3 + 2]
    }

    const coreOffset = offset + shell.length

    for (let v = 0; v < core.length; v += 3) {
      blockPositions[coreOffset + v] = core[v] + centers[i * 3]
      blockPositions[coreOffset + v + 1] = core[v + 1] + centers[i * 3 + 1]
      blockPositions[coreOffset + v + 2] = core[v + 2] + centers[i * 3 + 2]
    }
  }

  for (let i = 0; i < COUNT * perCube; i++) {
    blockColors[i * 3] = CHAIN_INK.r
    blockColors[i * 3 + 1] = CHAIN_INK.g
    blockColors[i * 3 + 2] = CHAIN_INK.b
  }

  // Arestas: o contorno do bloco em linha, e a linha da corrente ligando um
  // bloco ao seguinte. O pontilhado marca o caminho; a linha diz que os blocos
  // são presos uns aos outros.
  const edgeTemplate = cubeEdges(1.5)
  const coreTemplate = cubeEdges(0.6)
  const perCubeEdge = (edgeTemplate.length + coreTemplate.length) / 3
  const edgePositions = new Float32Array(COUNT * perCubeEdge * 3)
  const edgeColors = new Float32Array(COUNT * perCubeEdge * 3)

  for (let i = 0; i < COUNT; i++) {
    const offset = i * perCubeEdge * 3

    for (let v = 0; v < edgeTemplate.length; v += 3) {
      edgePositions[offset + v] = edgeTemplate[v] + centers[i * 3]
      edgePositions[offset + v + 1] = edgeTemplate[v + 1] + centers[i * 3 + 1]
      edgePositions[offset + v + 2] = edgeTemplate[v + 2] + centers[i * 3 + 2]
    }

    const coreOffset = offset + edgeTemplate.length

    for (let v = 0; v < coreTemplate.length; v += 3) {
      edgePositions[coreOffset + v] = coreTemplate[v] + centers[i * 3]
      edgePositions[coreOffset + v + 1] = coreTemplate[v + 1] + centers[i * 3 + 1]
      edgePositions[coreOffset + v + 2] = coreTemplate[v + 2] + centers[i * 3 + 2]
    }
  }

  for (let i = 0; i < COUNT * perCubeEdge; i++) {
    edgeColors[i * 3] = CHAIN_INK.r
    edgeColors[i * 3 + 1] = CHAIN_INK.g
    edgeColors[i * 3 + 2] = CHAIN_INK.b
  }

  const edgeGeometry = new THREE.BufferGeometry()
  edgeGeometry.setAttribute("position", new THREE.BufferAttribute(edgePositions, 3))
  const edgeColorAttribute = new THREE.BufferAttribute(edgeColors, 3)
  edgeGeometry.setAttribute("color", edgeColorAttribute)
  const edgeMaterial = new THREE.LineBasicMaterial({
    transparent: true,
    opacity: 0.55,
    vertexColors: true,
  })

  const chainPositions = new Float32Array((COUNT - 1) * 6)

  for (let i = 0; i < COUNT - 1; i++) {
    for (let axis = 0; axis < 3; axis++) {
      chainPositions[i * 6 + axis] = centers[i * 3 + axis]
      chainPositions[i * 6 + 3 + axis] = centers[(i + 1) * 3 + axis]
    }
  }

  const chainGeometry = new THREE.BufferGeometry()
  chainGeometry.setAttribute("position", new THREE.BufferAttribute(chainPositions, 3))
  const chainMaterial = new THREE.LineBasicMaterial({
    color: CHAIN_LINK,
    transparent: true,
    opacity: 0.55,
  })

  const blockGeometry = new THREE.BufferGeometry()
  blockGeometry.setAttribute("position", new THREE.BufferAttribute(blockPositions, 3))
  const blockColorAttribute = new THREE.BufferAttribute(blockColors, 3)
  blockGeometry.setAttribute("color", blockColorAttribute)
  const blockMaterial = new THREE.PointsMaterial({
    size: 0.08,
    transparent: true,
    opacity: 0.95,
    vertexColors: true,
  })

  // Os elos também são pontos: pontilhado fraco marcando o caminho que o dado
  // vai percorrer.
  const LINK_DOTS = dense ? 16 : 11
  const linkPositions = new Float32Array((COUNT - 1) * LINK_DOTS * 3)
  let linkCursor = 0

  for (let i = 0; i < COUNT - 1; i++) {
    for (let d = 0; d < LINK_DOTS; d++) {
      const t = (d + 1) / (LINK_DOTS + 1)

      for (let axis = 0; axis < 3; axis++) {
        const from = centers[i * 3 + axis]
        const to = centers[(i + 1) * 3 + axis]
        linkPositions[linkCursor + axis] = from + (to - from) * t
      }

      linkCursor += 3
    }
  }

  const linkGeometry = new THREE.BufferGeometry()
  linkGeometry.setAttribute("position", new THREE.BufferAttribute(linkPositions, 3))
  const linkMaterial = new THREE.PointsMaterial({
    color: CHAIN_LINK,
    size: 0.05,
    transparent: true,
    opacity: 0.8,
  })

  // O dado em trânsito: uma cabeça e um rastro que a segue com atraso.
  const COMETS = dense ? 3 : 2
  const TAIL = dense ? 9 : 6
  const SPACING = 0.016

  const headPositions = new Float32Array(COMETS * 3)
  const headGeometry = new THREE.BufferGeometry()
  const headAttribute = new THREE.BufferAttribute(headPositions, 3)
  headGeometry.setAttribute("position", headAttribute)
  const headMaterial = new THREE.PointsMaterial({
    color: CHAIN_DATA,
    size: 0.24,
    transparent: true,
    opacity: 1,
  })

  const tailPositions = new Float32Array(COMETS * TAIL * 3)
  const tailColors = new Float32Array(COMETS * TAIL * 3)
  const tailGeometry = new THREE.BufferGeometry()
  const tailAttribute = new THREE.BufferAttribute(tailPositions, 3)
  tailGeometry.setAttribute("position", tailAttribute)
  tailGeometry.setAttribute("color", new THREE.BufferAttribute(tailColors, 3))
  const tailMaterial = new THREE.PointsMaterial({
    size: 0.12,
    transparent: true,
    opacity: 0.85,
    vertexColors: true,
  })

  for (let k = 0; k < COMETS; k++) {
    for (let t = 0; t < TAIL; t++) {
      const fade = 1 - t / TAIL
      const index = (k * TAIL + t) * 3
      tailColors[index] = CHAIN_DATA.r + (CHAIN_LINK.r - CHAIN_DATA.r) * (1 - fade)
      tailColors[index + 1] = CHAIN_DATA.g + (CHAIN_LINK.g - CHAIN_DATA.g) * (1 - fade)
      tailColors[index + 2] = CHAIN_DATA.b + (CHAIN_LINK.b - CHAIN_DATA.b) * (1 - fade)
    }
  }

  const group = new THREE.Group()
  group.add(new THREE.LineSegments(chainGeometry, chainMaterial))
  group.add(new THREE.LineSegments(edgeGeometry, edgeMaterial))
  group.add(new THREE.Points(blockGeometry, blockMaterial))
  group.add(new THREE.Points(linkGeometry, linkMaterial))
  group.add(new THREE.Points(tailGeometry, tailMaterial))
  group.add(new THREE.Points(headGeometry, headMaterial))

  function pathPoint(travel: number, target: Float32Array, offset: number) {
    const clamped = Math.min(Math.max(travel, 0), 1)
    const position = clamped * (COUNT - 1)
    const segment = Math.min(Math.floor(position), COUNT - 2)
    const inside = position - segment

    for (let axis = 0; axis < 3; axis++) {
      const from = centers[segment * 3 + axis]
      const to = centers[(segment + 1) * 3 + axis]
      target[offset + axis] = from + (to - from) * inside
    }
  }

  const travel = new Float32Array(COMETS)

  return {
    object: group,
    update: (elapsed) => {
      for (let k = 0; k < COMETS; k++) {
        const head = (elapsed * 0.2 + k / COMETS) % 1
        travel[k] = head
        pathPoint(head, headPositions, k * 3)

        for (let t = 0; t < TAIL; t++) {
          pathPoint(head - (t + 1) * SPACING, tailPositions, (k * TAIL + t) * 3)
        }
      }

      headAttribute.needsUpdate = true
      tailAttribute.needsUpdate = true

      // O bloco não se mexe: ele muda de cor enquanto o dado passa por ele. É a
      // conferência acontecendo bloco a bloco, sem nada sair do lugar.
      for (let i = 0; i < COUNT; i++) {
        const anchor = i / (COUNT - 1)
        let activation = 0

        for (let k = 0; k < COMETS; k++) {
          const distance = Math.abs(travel[k] - anchor) * 6
          activation = Math.max(activation, Math.exp(-distance * distance))
        }

        const red = CHAIN_INK.r + (CHAIN_ACTIVE.r - CHAIN_INK.r) * activation
        const green = CHAIN_INK.g + (CHAIN_ACTIVE.g - CHAIN_INK.g) * activation
        const blue = CHAIN_INK.b + (CHAIN_ACTIVE.b - CHAIN_INK.b) * activation

        const offset = i * perCube * 3

        for (let v = 0; v < perCube; v++) {
          blockColors[offset + v * 3] = red
          blockColors[offset + v * 3 + 1] = green
          blockColors[offset + v * 3 + 2] = blue
        }

        const edgeOffset = i * perCubeEdge * 3

        for (let v = 0; v < perCubeEdge; v++) {
          edgeColors[edgeOffset + v * 3] = red
          edgeColors[edgeOffset + v * 3 + 1] = green
          edgeColors[edgeOffset + v * 3 + 2] = blue
        }
      }

      blockColorAttribute.needsUpdate = true
      edgeColorAttribute.needsUpdate = true
    },
    dispose: () => {
      blockGeometry.dispose()
      edgeGeometry.dispose()
      chainGeometry.dispose()
      linkGeometry.dispose()
      headGeometry.dispose()
      tailGeometry.dispose()
      blockMaterial.dispose()
      edgeMaterial.dispose()
      chainMaterial.dispose()
      linkMaterial.dispose()
      headMaterial.dispose()
      tailMaterial.dispose()
    },
  }
}
// ---------------------------------------------------------------------------
// archive — pastas de arquivo se formando no banner da Transparência. As
// arestas partem espalhadas e se juntam em pastas com aba, uma depois da outra;
// depois, folhas soltas continuam entrando nelas. A página fala de documentos
// públicos, então o banner mostra documentos sendo guardados.
// ---------------------------------------------------------------------------
type Folder = {
  object: THREE.LineSegments
  material: THREE.LineBasicMaterial
  geometry: THREE.BufferGeometry
  attribute: THREE.BufferAttribute
  base: Float32Array
  scattered: Float32Array
  delay: number
  mouth: [number, number, number]
}

function folderEdges(width: number, height: number, tabWidth: number, tabHeight: number, depth: number): Float32Array {
  // Silhueta da pasta: retângulo com a aba erguida na esquerda, igual à do
  // ícone de pasta que a página usa nos cartões.
  const outline: [number, number][] = [
    [-width / 2, -height / 2],
    [width / 2, -height / 2],
    [width / 2, height / 2],
    [-width / 2 + tabWidth + 0.22, height / 2],
    [-width / 2 + tabWidth, height / 2 + tabHeight],
    [-width / 2, height / 2 + tabHeight],
  ]

  const values: number[] = []
  const faces = [-depth / 2, depth / 2]

  for (const z of faces) {
    for (let i = 0; i < outline.length; i++) {
      const [ax, ay] = outline[i]
      const [bx, by] = outline[(i + 1) % outline.length]
      values.push(ax, ay, z, bx, by, z)
    }
  }

  for (const [x, y] of outline) {
    values.push(x, y, faces[0], x, y, faces[1])
  }

  return new Float32Array(values)
}

const ARCHIVE_ASSEMBLY = 1.2

function buildArchive({ dense }: BuildContext): Built {
  const COUNT = dense ? 4 : 3
  const GAP = 3.5
  const group = new THREE.Group()
  const folders: Folder[] = []

  for (let i = 0; i < COUNT; i++) {
    const base = folderEdges(2.6, 1.9, 1.0, 0.34, 0.7)
    const scattered = new Float32Array(base.length)

    for (let v = 0; v < base.length; v += 3) {
      scattered[v] = base[v] + (Math.random() - 0.5) * 5
      scattered[v + 1] = base[v + 1] + (Math.random() - 0.5) * 4
      scattered[v + 2] = base[v + 2] + (Math.random() - 0.5) * 5
    }

    const positions = new Float32Array(scattered)
    const geometry = new THREE.BufferGeometry()
    const attribute = new THREE.BufferAttribute(positions, 3)
    geometry.setAttribute("position", attribute)

    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(i % 2 === 0 ? TEAL : MAGENTA),
      transparent: true,
      opacity: 0,
    })

    const object = new THREE.LineSegments(geometry, material)
    const x = (i - (COUNT - 1) / 2) * GAP
    object.position.set(x, 0, 0)
    object.rotation.y = -0.42

    group.add(object)
    folders.push({
      object,
      material,
      geometry,
      attribute,
      base,
      scattered,
      delay: i * 0.42,
      mouth: [x - 0.3, 1.05, 0],
    })
  }

  // Folhas entrando nas pastas: cada uma nasce fora do quadro, descreve um arco
  // e some na boca de uma pasta. É o único cálculo por quadro depois que a
  // formação termina.
  const SHEETS = dense ? 18 : 10
  const sheetPositions = new Float32Array(SHEETS * 3)
  const sheetOrigins = new Float32Array(SHEETS * 3)
  const sheetTargets = new Uint8Array(SHEETS)
  const sheetProgress = new Float32Array(SHEETS)
  const sheetSpeeds = new Float32Array(SHEETS)

  function respawn(index: number) {
    sheetOrigins[index * 3] = -9 - Math.random() * 3
    sheetOrigins[index * 3 + 1] = -1.6 + Math.random() * 2
    sheetOrigins[index * 3 + 2] = (Math.random() - 0.5) * 3
    sheetTargets[index] = Math.floor(Math.random() * COUNT)
    sheetProgress[index] = 0
    sheetSpeeds[index] = 0.18 + Math.random() * 0.22
  }

  for (let i = 0; i < SHEETS; i++) {
    respawn(i)
    sheetProgress[i] = Math.random()
  }

  const sheetGeometry = new THREE.BufferGeometry()
  const sheetAttribute = new THREE.BufferAttribute(sheetPositions, 3)
  sheetGeometry.setAttribute("position", sheetAttribute)
  const sheetMaterial = new THREE.PointsMaterial({
    color: new THREE.Color(YELLOW),
    size: 0.16,
    transparent: true,
    opacity: 0.9,
  })
  group.add(new THREE.Points(sheetGeometry, sheetMaterial))

  let assembly = 0

  return {
    object: group,
    update: (elapsed, delta, pointer) => {
      assembly += delta

      for (let i = 0; i < folders.length; i++) {
        const folder = folders[i]
        const progress = Math.min(Math.max((assembly - folder.delay) / ARCHIVE_ASSEMBLY, 0), 1)

        if (progress < 1) {
          const eased = 1 - Math.pow(1 - progress, 3)
          const positions = folder.attribute.array as Float32Array

          for (let v = 0; v < positions.length; v++) {
            positions[v] = folder.scattered[v] + (folder.base[v] - folder.scattered[v]) * eased
          }

          folder.attribute.needsUpdate = true
          folder.material.opacity = eased * 0.9
          folder.object.rotation.y = -1.5 + eased * 1.08
        }

        folder.object.position.y = Math.sin(elapsed * 0.6 + i) * 0.12
      }

      for (let i = 0; i < SHEETS; i++) {
        sheetProgress[i] += sheetSpeeds[i] * delta

        if (sheetProgress[i] >= 1) respawn(i)

        const t = sheetProgress[i]
        const folder = folders[sheetTargets[i]]

        for (let axis = 0; axis < 3; axis++) {
          const from = sheetOrigins[i * 3 + axis]
          const to = folder.mouth[axis]
          sheetPositions[i * 3 + axis] = from + (to - from) * t
        }

        sheetPositions[i * 3 + 1] += Math.sin(Math.PI * t) * 0.85
      }

      sheetAttribute.needsUpdate = true

      group.rotation.y = Math.sin(elapsed / 9) * 0.1 + pointer.x * 0.16
      group.rotation.x = 0.12 + pointer.y * -0.08
    },
    dispose: () => {
      for (const folder of folders) {
        folder.geometry.dispose()
        folder.material.dispose()
      }
      sheetGeometry.dispose()
      sheetMaterial.dispose()
    },
  }
}

// ---------------------------------------------------------------------------
// care — o banner do Painel de Impacto: duas crianças brincando de bola.
//
// Esta é a única cena do projeto que abre mão do orçamento mínimo, e é uma
// decisão consciente. Traço e partícula funcionam para ideia abstrata — rede,
// corrente, arquivo. Para gente, não funcionam: figura de contorno lê como
// pictograma, e pictograma não emociona ninguém. Então aqui tem volume, luz e
// sombra de verdade: malhas de primitivas, duas fontes de luz e um plano que
// recebe a sombra dos personagens.
//
// O que continua valendo: a cena só existe para quem passou no portão de
// capacidade, o laço para fora da tela, e o vigia de quadro desliga tudo se os
// 30fps não forem cumpridos. Em tela pequena a sombra sai e a malha fica mais
// grossa. O custo maior é assumido num lugar só, não espalhado pelo site.
// ---------------------------------------------------------------------------
const CARE_GROUND = -1.4
const CARE_REACH = 1.55

type Child = {
  root: THREE.Group
  body: THREE.Group
  arms: [THREE.Group, THREE.Group]
  legs: [THREE.Group, THREE.Group]
  facing: number
}

type Junk = {
  geometries: THREE.BufferGeometry[]
  materials: THREE.Material[]
}

function buildChild(color: number, accent: number, dense: boolean, junk: Junk): Child {
  const radial = dense ? 14 : 8
  const caps = dense ? 6 : 4

  const skin = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.62, metalness: 0.04 })
  const trim = new THREE.MeshStandardMaterial({ color: new THREE.Color(accent), roughness: 0.7, metalness: 0.04 })
  junk.materials.push(skin, trim)

  const headGeometry = new THREE.SphereGeometry(0.3, dense ? 26 : 14, dense ? 18 : 10)
  const torsoGeometry = new THREE.CapsuleGeometry(0.27, 0.42, caps, radial)
  const armGeometry = new THREE.CapsuleGeometry(0.1, 0.44, caps, radial)
  const legGeometry = new THREE.CapsuleGeometry(0.13, 0.5, caps, radial)
  junk.geometries.push(headGeometry, torsoGeometry, armGeometry, legGeometry)

  const root = new THREE.Group()
  const body = new THREE.Group()
  root.add(body)

  const head = new THREE.Mesh(headGeometry, skin)
  head.position.y = 1.86
  head.castShadow = true
  body.add(head)

  const torso = new THREE.Mesh(torsoGeometry, skin)
  torso.position.y = 1.18
  torso.castShadow = true
  body.add(torso)

  // Braços e pernas penduram de um grupo posicionado na articulação: girar o
  // grupo é girar o membro em torno do ombro e do quadril, sem tocar na malha.
  const arms: [THREE.Group, THREE.Group] = [new THREE.Group(), new THREE.Group()]
  const legs: [THREE.Group, THREE.Group] = [new THREE.Group(), new THREE.Group()]

  arms.forEach((arm, index) => {
    const side = index === 0 ? -1 : 1
    arm.position.set(side * 0.34, 1.42, 0)

    const mesh = new THREE.Mesh(armGeometry, skin)
    mesh.position.y = -0.32
    mesh.castShadow = true
    arm.add(mesh)
    body.add(arm)
  })

  legs.forEach((leg, index) => {
    const side = index === 0 ? -1 : 1
    leg.position.set(side * 0.14, 0.86, 0)

    const mesh = new THREE.Mesh(legGeometry, trim)
    mesh.position.y = -0.38
    mesh.castShadow = true
    leg.add(mesh)
    body.add(leg)
  })

  return { root, body, arms, legs, facing: 1 }
}

// Sobe de 0 a 1 e volta, dentro da janela dada. Serve para o gesto de arremesso
// e para o de recepção, que são o mesmo movimento em momentos diferentes.
function pulse(value: number, start: number, end: number): number {
  if (value < start || value > end) return 0

  return Math.sin(((value - start) / (end - start)) * Math.PI)
}

function buildCare({ dense }: BuildContext): Built {
  const junk: Junk = { geometries: [], materials: [] }
  const group = new THREE.Group()
  group.position.y = CARE_GROUND

  const key = new THREE.DirectionalLight(0xffffff, 2.2)
  key.position.set(2.6, 5.2, 3.4)

  if (dense) {
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.left = -4
    key.shadow.camera.right = 4
    key.shadow.camera.top = 4
    key.shadow.camera.bottom = -4
    key.shadow.camera.near = 0.5
    key.shadow.camera.far = 18
    key.shadow.bias = -0.0012
  }

  const rim = new THREE.DirectionalLight(0x00dece, 0.8)
  rim.position.set(-3.4, 2.2, -2.6)

  // O alvo da luz precisa viver no mesmo grupo: assim a direção da sombra
  // acompanha a cena quando ela gira, em vez de escorregar.
  group.add(key, key.target, rim, new THREE.HemisphereLight(0xffffff, 0xc9cfcd, 1.6))

  const left = buildChild(0x00dece, 0x0a7a73, dense, junk)
  const right = buildChild(0xbb2dd7, 0x9a1fb3, dense, junk)

  left.root.position.x = -CARE_REACH
  left.root.rotation.y = 0.42
  left.facing = 1

  right.root.position.x = CARE_REACH
  right.root.rotation.y = -0.42
  right.facing = -1

  group.add(left.root, right.root)

  const ballGeometry = new THREE.SphereGeometry(0.26, dense ? 26 : 14, dense ? 18 : 10)
  const ballMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xffdc00),
    roughness: 0.42,
    metalness: 0.06,
  })
  junk.geometries.push(ballGeometry)
  junk.materials.push(ballMaterial)

  const ball = new THREE.Mesh(ballGeometry, ballMaterial)
  ball.castShadow = true
  group.add(ball)

  // Plano invisível que só existe para receber a sombra: o fundo da seção
  // continua sendo o fundo da seção, e mesmo assim as crianças pisam em algo.
  if (dense) {
    const floorGeometry = new THREE.PlaneGeometry(14, 8)
    const floorMaterial = new THREE.ShadowMaterial({ opacity: 0.17 })
    junk.geometries.push(floorGeometry)
    junk.materials.push(floorMaterial)

    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    group.add(floor)
  }

  const HAND_HEIGHT = 1.62
  const FLIGHT = 1.5

  return {
    object: group,
    update: (elapsed, _delta, pointer) => {
      // A bola vai e volta: `outbound` diz de quem para quem, `travel` diz onde
      // ela está no caminho. Todo o resto da cena é reação a esses dois números.
      const cycle = (elapsed / FLIGHT) % 2
      const outbound = cycle < 1
      const travel = cycle % 1

      const thrower = outbound ? left : right
      const catcher = outbound ? right : left

      const fromX = thrower.root.position.x + thrower.facing * 0.3
      const toX = catcher.root.position.x + catcher.facing * 0.3

      ball.position.x = fromX + (toX - fromX) * travel
      ball.position.y = HAND_HEIGHT + Math.sin(Math.PI * travel) * 1.15
      ball.position.z = Math.sin(Math.PI * travel) * 0.35

      for (const child of [left, right]) {
        const throwing = child === thrower ? pulse(travel, 0, 0.26) : 0
        const catching = child === catcher ? pulse(travel, 0.66, 1) : 0
        const gesture = Math.max(throwing, catching)

        // Braços sobem juntos para lançar e para receber; o resto do tempo
        // balançam de leve, para a criança não virar estátua entre um passe e
        // outro.
        const idle = Math.sin(elapsed * 1.7 + child.root.position.x) * 0.12
        child.arms[0].rotation.z = -(idle + gesture * 2.1)
        child.arms[1].rotation.z = idle + gesture * 2.1
        child.arms[0].rotation.x = -gesture * 0.5
        child.arms[1].rotation.x = -gesture * 0.5

        // Pulinho no gesto, com o corpo esticando junto: é o que dá peso ao
        // movimento, e é a diferença entre brincar e acenar.
        const hop = gesture * 0.34
        child.body.position.y = hop
        child.body.scale.y = 1 + gesture * 0.05

        const swing = Math.sin(elapsed * 1.7 + child.root.position.x) * 0.08
        child.legs[0].rotation.x = swing - gesture * 0.3
        child.legs[1].rotation.x = -swing - gesture * 0.3

        // As duas se viram para acompanhar a bola: sem isso ficam olhando para o
        // vazio enquanto ela passa entre elas.
        const toBall = ball.position.x - child.root.position.x
        child.root.rotation.y = child.facing * 0.42 + toBall * 0.06
      }

      group.rotation.y = Math.sin(elapsed / 9) * 0.1 + pointer.x * 0.16
      group.rotation.x = pointer.y * -0.05
    },
    dispose: () => {
      for (const geometry of junk.geometries) geometry.dispose()
      for (const material of junk.materials) material.dispose()
    },
  }
}

const BUILDERS: Record<SceneVariant, (context: BuildContext) => Built> = {
  network: buildNetwork,
  symbol: buildSymbol,
  drift: buildDrift,
  chain: buildChain,
  archive: buildArchive,
  care: buildCare,
}

const FIT: Record<SceneVariant, Fit> = {
  network: { halfWidth: 3.8, halfHeight: 3.8 },
  symbol: { halfWidth: 2.0, halfHeight: 3.6 },
  drift: { halfWidth: 8.0, halfHeight: 4.5 },
  chain: { halfWidth: 7.6, halfHeight: 2.2 },
  archive: { halfWidth: 7.0, halfHeight: 2.2 },
  care: { halfWidth: 3, halfHeight: 2.05 },
}

const FIELD_OF_VIEW = 45

// As cenas que trocam o orçamento mínimo por volume. Hoje só o banner do
// Painel de Impacto: gente precisa ter corpo.
const RICH_SCENES = new Set<SceneVariant>(["care"])

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

    const dense = window.innerWidth >= 900
    // Cena "rica" é a exceção declarada: malha, luz e sombra em vez de pontos e
    // linhas. Ela paga antisserrilhado e um pixel ratio maior, porque um volume
    // com a borda serrilhada não convence ninguém. O vigia de quadro continua
    // valendo — se o aparelho não der conta, a cena sai inteira.
    const rich = RICH_SCENES.has(variant)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(FIELD_OF_VIEW, 1, 0.1, 100)

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: rich,
      powerPreference: rich ? "high-performance" : "low-power",
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, rich ? 1.75 : 1.5))
    renderer.setClearAlpha(0)

    if (rich && dense) {
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
    }
    renderer.domElement.style.width = "100%"
    renderer.domElement.style.height = "100%"
    renderer.domElement.style.display = "block"
    container.appendChild(renderer.domElement)

    const built = BUILDERS[variant]({ dense })
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

      // A distância sai do formato do container, e não de um número fixo: numa
      // tira larga e baixa (o banner no celular) a câmera se aproxima até a
      // altura caber, e num bloco quadrado ela recua até a largura caber.
      const fit = FIT[variant]
      const half = Math.tan((FIELD_OF_VIEW * Math.PI) / 360)
      const byHeight = fit.halfHeight / half
      const byWidth = fit.halfWidth / (half * camera.aspect)

      camera.position.z = Math.max(byHeight, byWidth) * 1.08
      camera.updateProjectionMatrix()

      const visibleHalfHeight = half * camera.position.z
      built.resize?.(visibleHalfHeight * camera.aspect, visibleHalfHeight)
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

  return <div ref={containerRef} className={className} aria-hidden="true" data-decorativo />
}
