import { ContactMessageInterface } from "../../interfaces/contact-message-interface.js";
import { ContactMessage } from "../../models/contact-message-model.js";

type RequestWallRemovalProps = Pick<ContactMessageInterface, 'name' | 'email' | 'message'>

// O pedido de quem quer tirar o nome do Mural do Bem. A rota é pública e não diz se o e-mail tem
// doação: responder "não achamos ninguém" ensinaria a qualquer um quem doou para a associação.
// O cruzamento com o cadastro acontece só no painel, e a retirada é um ato da equipe.
export class RequestWallRemovalService {
  async execute({ name, email, message }: RequestWallRemovalProps) {

    const contact = await ContactMessage.create({
      channel: "wall_removal",
      subject: null,
      name,
      email,
      phone: null,
      message,
      status: "open",
    })

    return { id: contact.id, channel: contact.channel, created_at: contact.created_at }
  }
}
