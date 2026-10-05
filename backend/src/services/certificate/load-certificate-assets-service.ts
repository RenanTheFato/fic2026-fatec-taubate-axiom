import { CertificateAsset } from "../../models/certificate-asset-model.js";
import { referencedAssets } from "../../utils/certificate-design.js";
import type { CertificateDesignSpec } from "../../utils/certificate-design.js";

// Um asset nunca muda depois de gravado (não existe rota de edição), então o arquivo lido uma vez
// pode ficar em memória. O teto impede que uma biblioteca grande vire vazamento: passando dele, o
// mais antigo sai primeiro.
const cache = new Map<string, Buffer>()
const CACHE_LIMIT = 64

export class LoadCertificateAssetsService {
  async execute({ design }: { design: CertificateDesignSpec }) {
    const ids = referencedAssets(design)
    const loaded = new Map<string, Buffer>()
    const missing = ids.filter((id) => !cache.has(id))

    if (missing.length > 0) {
      const rows = await CertificateAsset.findAll({ where: { id: missing }, attributes: ["id", "data"] })

      for (const row of rows) {
        cache.set(row.id, row.data)

        if (cache.size > CACHE_LIMIT) {
          const oldest = cache.keys().next().value

          if (oldest) {
            cache.delete(oldest)
          }
        }
      }
    }

    for (const id of ids) {
      const data = cache.get(id)

      if (data) {
        loaded.set(id, data)
      }
    }

    return loaded
  }
}
