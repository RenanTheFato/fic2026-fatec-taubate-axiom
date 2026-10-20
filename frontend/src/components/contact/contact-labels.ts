import type { BadgeTone } from "../ui/badge"
import type { ContactChannel } from "../../types/contact-types"
import type { UserRole } from "../../types/user-types"

export type SubjectOption = { value: string; label: string }

// Os assuntos de cada formulário, em um lugar só: a página pública oferece as
// opções, e a caixa de entrada do painel mostra o mesmo rótulo para a mesma
// chave. O backend confere a chave contra a lista do canal, então as duas
// listas mudam juntas (`backend/src/models/contact-message-model.ts`).
export const CONTACT_SUBJECTS: Record<Exclude<ContactChannel, "wall_removal">, SubjectOption[]> = {
  contact: [
    { value: "atendimento", label: "Quero atendimento para alguém" },
    { value: "doacao", label: "Dúvida sobre doação" },
    { value: "voluntariado", label: "Quero ser voluntário" },
    { value: "parceria", label: "Proposta de parceria ou patrocínio" },
    { value: "documento", label: "Pedido de documento" },
    { value: "outro", label: "Outro assunto" },
  ],
  ombudsman: [
    { value: "elogio", label: "Elogio" },
    { value: "sugestao", label: "Sugestão" },
    { value: "reclamacao", label: "Reclamação" },
    { value: "denuncia", label: "Denúncia" },
  ],
  work: [
    { value: "clinico", label: "Área clínica e terapêutica" },
    { value: "educacao", label: "Educação" },
    { value: "administrativo", label: "Administrativo e financeiro" },
    { value: "comunicacao", label: "Comunicação e captação" },
    { value: "apoio", label: "Serviços de apoio" },
    { value: "outra", label: "Outra área" },
  ],
}

export const CHANNEL_LABEL: Record<ContactChannel, { label: string; tone: BadgeTone }> = {
  contact: { label: "Fale conosco", tone: "institutional" },
  ombudsman: { label: "Ouvidoria", tone: "partner" },
  work: { label: "Trabalhe conosco", tone: "success" },
  wall_removal: { label: "Retirada do mural", tone: "reward" },
}

export function subjectLabel(channel: ContactChannel, subject: string | null): string | null {
  if (channel === "wall_removal" || !subject) return null

  return CONTACT_SUBJECTS[channel].find((option) => option.value === subject)?.label ?? subject
}

// Os canais que a tela oferece no filtro. Espelha a regra do backend, que é a
// autoridade: ouvidoria e candidatura só chegam à administração.
export function channelsFor(role: UserRole | undefined): ContactChannel[] {
  if (role === "admin") return ["contact", "ombudsman", "work", "wall_removal"]
  if (role === "communication") return ["contact", "wall_removal"]

  return []
}
