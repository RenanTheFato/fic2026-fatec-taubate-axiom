import type { CertificateAssetType } from "../models/certificate-asset-model.js";

// O tipo de uma imagem enviada é lido dos próprios bytes, e não do Content-Type nem da extensão,
// que são declarações de quem envia. O pdfkit só desenha PNG e JPEG: qualquer outra coisa é
// recusada aqui, antes de chegar ao banco e muito antes de quebrar a geração de um certificado.

export interface ImageInfo {
  mime_type: CertificateAssetType,
  width: number,
  height: number,
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

function readPng(data: Buffer): ImageInfo | null {
  if (data.length < 24 || !PNG_SIGNATURE.every((byte, index) => data[index] === byte)) {
    return null
  }

  // O primeiro bloco de todo PNG é o IHDR, com largura e altura em big-endian logo depois do nome.
  if (data.toString("ascii", 12, 16) !== "IHDR") {
    return null
  }

  return { mime_type: "image/png", width: data.readUInt32BE(16), height: data.readUInt32BE(20) }
}

function readJpeg(data: Buffer): ImageInfo | null {
  if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) {
    return null
  }

  // O JPEG é uma sequência de segmentos. A medida está no primeiro SOF (0xC0 a 0xCF, menos os
  // marcadores de tabela 0xC4, 0xC8 e 0xCC), que pode vir depois de metadados de qualquer tamanho.
  let offset = 2

  while (offset + 9 < data.length) {
    if (data[offset] !== 0xff) {
      return null
    }

    const marker = data[offset + 1]
    const length = data.readUInt16BE(offset + 2)
    const isFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)

    if (isFrame) {
      return { mime_type: "image/jpeg", height: data.readUInt16BE(offset + 5), width: data.readUInt16BE(offset + 7) }
    }

    offset += 2 + length
  }

  return null
}

export function readImageInfo(data: Buffer): ImageInfo | null {
  const info = readPng(data) ?? readJpeg(data)

  if (!info || info.width === 0 || info.height === 0) {
    return null
  }

  return info
}
