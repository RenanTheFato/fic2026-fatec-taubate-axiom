import { toString } from "qrcode";
import { NotFoundError } from "../../config/errors.js";
import { env } from "../../config/env.js";
import { Event } from "../../models/event-model.js";
import { Registration } from "../../models/registration-model.js";
import { formatTicketCode, normalizeTicketCode } from "../../utils/ticket-code.js";

// A página do ingresso. O código é a credencial, como o hash do recibo: quem o tem é quem se
// inscreveu ou quem comprou. Por isso o retorno leva o nome, que a portaria confere, mas nunca o
// e-mail nem o telefone.
//
// O QR carrega o endereço da própria página, e não só o código: a câmera de qualquer celular da
// equipe abre a página e registra a entrada dali, e um leitor de mão digita o endereço no campo
// de check-in do painel, que sabe tirar o código do fim dele.
export class GetTicketService {
  async execute({ code }: { code: string }) {

    const found = await Registration.findOne({
      where: { ticket_code: normalizeTicketCode(code) },
      include: [{
        model: Event,
        as: "event",
        attributes: ["id", "title", "slug", "location", "starts_at", "ends_at", "status"],
      }],
    })

    const registration = found as (Registration & { event?: Event | null }) | null

    if (!registration || !registration.event) {
      throw new NotFoundError("Registration Not Found")
    }

    const formatted = formatTicketCode(registration.ticket_code)
    const svg = await toString(`${env.WEB_URL}/inscricao/${formatted}`, {
      type: "svg",
      margin: 1,
      color: { dark: "#1C1917", light: "#FFFFFF" },
    })

    return {
      id: registration.id,
      ticket_code: formatted,
      participant_name: registration.participant_name,
      status: registration.status,
      paid: registration.transaction_id !== null,
      checked_in_at: registration.checked_in_at,
      event: registration.event.get({ plain: true }),
      qr: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
    }
  }
}
