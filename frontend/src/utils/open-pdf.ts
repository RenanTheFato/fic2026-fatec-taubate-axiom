// Abre um PDF que só existe depois de uma requisição autenticada. A aba nasce
// no clique, ainda vazia, porque o navegador bloqueia janela aberta depois de
// um `await`: fora do gesto da pessoa, `window.open` vira pop-up indesejado.
// Quando o arquivo chega, a aba recebe o endereço local dele.
export async function openPdf(load: () => Promise<Blob>): Promise<void> {
  const tab = window.open("", "_blank")

  try {
    const blob = await load()
    const url = URL.createObjectURL(blob)

    if (tab) {
      tab.opener = null
      tab.location.href = url
    } else {
      window.location.assign(url)
    }

    // A aba já leu o arquivo; o endereço local pode ser liberado depois.
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (error: unknown) {
    tab?.close()
    throw error
  }
}
