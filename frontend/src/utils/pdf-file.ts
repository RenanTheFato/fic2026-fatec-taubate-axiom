// Baixar e imprimir um PDF que chegou como arquivo. Baixar dá ao arquivo um
// nome legível, em vez do endereço da API. Imprimir abre o diálogo da
// impressora sem sair da página; onde o navegador não imprime um PDF embutido
// (celular, sobretudo), o arquivo abre numa aba, e a pessoa imprime de lá.
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()

  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export function printPdf(blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const touch = window.matchMedia?.("(pointer: coarse)").matches ?? false

  if (touch) {
    window.open(url, "_blank", "noopener")
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    return
  }

  const frame = document.createElement("iframe")
  frame.title = "Certificado para impressão"
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;"
  frame.src = url

  frame.onload = () => {
    try {
      frame.contentWindow?.focus()
      frame.contentWindow?.print()
    } catch {
      window.open(url, "_blank", "noopener")
    }
  }

  document.body.appendChild(frame)
  window.setTimeout(() => {
    frame.remove()
    URL.revokeObjectURL(url)
  }, 120_000)
}
