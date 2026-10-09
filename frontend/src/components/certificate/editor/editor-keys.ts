// A tecla de comando do sistema, como os atalhos aparecem nas dicas: ⌘ no Mac,
// Ctrl no resto. O atalho em si aceita as duas.
export const MOD = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl"
