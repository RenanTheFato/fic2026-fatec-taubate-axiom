/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/tests/setup.ts"],
    include: ["src/tests/**/*.test.{ts,tsx}"],
    // Cada arquivo sobe um jsdom inteiro, e um por núcleo satura a máquina: o
    // foco e a digitação dos testes de formulário passavam a chegar fora de
    // ordem, e jornadas corretas falhavam uma vez a cada poucas rodadas. Metade
    // dos núcleos tira essa disputa, e o teto de tempo cobre o que sobra.
    maxWorkers: "50%",
    testTimeout: 15_000,
  },
})
