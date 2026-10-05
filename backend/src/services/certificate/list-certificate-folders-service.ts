import { QueryTypes } from "sequelize";
import { sequelize } from "../../config/sequelize.js";
import { Campaign } from "../../models/campaign-model.js";
import { Event } from "../../models/event-model.js";
import { folderKey } from "../../models/certificate-design-model.js";
import type { CertificateScope } from "../../models/certificate-design-model.js";

type FolderSummaryRow = {
  folder: string,
  versions: number,
  latest_id: string,
  latest_version: number,
  latest_label: string,
  latest_created_at: Date,
}

type IssuedRow = {
  folder: string,
  issued: number,
}

// As pastas do estúdio: o modelo padrão, cada campanha e cada evento. Toda campanha e todo evento
// aparecem, mesmo sem personalização: é assim que a equipe prepara o certificado de Natal enquanto
// a campanha ainda é rascunho. As contagens vêm somadas pelo banco.
export class ListCertificateFoldersService {
  async execute() {
    const [campaigns, events, summaries, issued] = await Promise.all([
      Campaign.findAll({ attributes: ["id", "title", "status", "starts_at"], order: [["starts_at", "DESC"], ["id", "ASC"]] }),
      Event.findAll({ attributes: ["id", "title", "status", "starts_at", "campaign_id"], order: [["starts_at", "DESC"], ["id", "ASC"]] }),
      sequelize.query<FolderSummaryRow>(
        `SELECT summary.folder, summary.versions, latest.id AS latest_id, latest.version AS latest_version,
                latest.label AS latest_label, latest.created_at AS latest_created_at
           FROM (SELECT folder, COUNT(*) AS versions, MAX(version) AS top FROM certificate_designs GROUP BY folder) summary
           JOIN certificate_designs latest ON latest.folder = summary.folder AND latest.version = summary.top`,
        { type: QueryTypes.SELECT }
      ),
      sequelize.query<IssuedRow>(
        `SELECT design.folder, COUNT(receipt.id) AS issued
           FROM receipts receipt
           JOIN certificate_designs design ON design.id = receipt.certificate_design_id
          GROUP BY design.folder`,
        { type: QueryTypes.SELECT }
      ),
    ])

    const summaryByFolder = new Map(summaries.map((row) => [row.folder, row]))
    const issuedByFolder = new Map(issued.map((row) => [row.folder, Number(row.issued)]))

    function describe(scope: CertificateScope, target_id: string | null, title: string, status: string | null) {
      const folder = folderKey(scope, target_id)
      const summary = summaryByFolder.get(folder)

      return {
        folder,
        scope,
        target_id,
        title,
        status,
        versions: summary ? Number(summary.versions) : 0,
        issued: issuedByFolder.get(folder) ?? 0,
        current: summary
          ? {
            id: summary.latest_id,
            version: Number(summary.latest_version),
            label: summary.latest_label,
            created_at: summary.latest_created_at,
          }
          : null,
      }
    }

    return [
      describe("default", null, "Modelo padrão", null),
      ...campaigns.map((campaign) => describe("campaign", campaign.id, campaign.title, campaign.status)),
      ...events.map((event) => describe("event", event.id, event.title, event.status)),
    ]
  }
}
