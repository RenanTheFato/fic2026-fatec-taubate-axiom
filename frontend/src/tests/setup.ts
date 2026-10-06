import "@testing-library/jest-dom/vitest"
import { configure } from "@testing-library/react"

// A suíte roda um arquivo por núcleo, e com todos ocupados uma consulta
// dublada pode levar mais de um segundo para resolver. O padrão de 1 s fazia
// `findBy` e `waitFor` falharem por cansaço da máquina, não por defeito da
// tela. Quatro segundos é teto, e não espera: o que chega antes passa antes.
configure({ asyncUtilTimeout: 4000 })

// O jsdom não implementa matchMedia. Os hooks do projeto já se defendem disso
// devolvendo o estado sem animação, mas o stub deixa o teste exercitar as duas
// pontas quando precisar.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList
}

// O jsdom não tem canvas. Sem este stub, a checagem de WebGL do hero enche a
// saída do teste com "Not implemented: getContext".
HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement["getContext"]
