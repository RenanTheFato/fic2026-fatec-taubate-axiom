import { ContactMessageInterface } from "../../interfaces/contact-message-interface.js";
import { ContactMessage } from "../../models/contact-message-model.js";

type CreateContactMessageProps = Pick<ContactMessageInterface, 'channel' | 'subject' | 'name' | 'email' | 'phone' | 'message'>

// O que os formulários de contato, ouvidoria e candidatura do site gravam. A mensagem chega aberta
// e fica na caixa de entrada do painel até alguém da equipe dar o atendimento por resolvido.
export class CreateContactMessageService {
  async execute({ channel, subject, name, email, phone, message }: CreateContactMessageProps) {

    const contact = await ContactMessage.create({
      channel,
      subject,
      name,
      email,
      phone,
      message,
      status: "open",
    })

    // A resposta é magra de propósito: quem enviou já sabe o que escreveu, e a rota é pública.
    return { id: contact.id, channel: contact.channel, created_at: contact.created_at }
  }
}
