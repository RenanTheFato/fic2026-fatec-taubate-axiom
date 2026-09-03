import type { FaqItem } from "../../types/institutional-types"

// PROVISÓRIO: as perguntas são as que o site precisa responder; as respostas
// foram escritas para não afirmar procedimento que não foi confirmado pela ONG.
// Onde o caminho depende de uma regra interna, a resposta manda falar com a
// associação em vez de inventar um fluxo. **Precisa de revisão da ONG antes da
// entrega final.**
const FAQ: FaqItem[] = [
  {
    id: "quem-atende",
    category: "atendimento",
    question: "Quem é atendido pela Somos do Bem?",
    answer:
      "Pessoas com Deficiência Intelectual e/ou Múltipla de causa neurológica e com Transtornos Invasivos do Desenvolvimento, e também as famílias dessas pessoas. O atendimento acontece em três frentes: o Ambulatório, a Escola de Educação Especial e o Programa de Oficina Terapêutica.",
  },
  {
    id: "como-conseguir-atendimento",
    category: "atendimento",
    question: "Como faço para conseguir atendimento?",
    answer:
      "O primeiro passo é falar com a associação pelo telefone (19) 3801-8890 ou pelo e-mail contato@somosdobem.org.br. A equipe explica os documentos necessários e a disponibilidade de cada programa, que varia ao longo do ano.",
  },
  {
    id: "onde-fica",
    category: "atendimento",
    question: "Onde ficam as unidades?",
    answer:
      "O Ambulatório e a Administração ficam na Alameda da Criança, 100, Vila Vitória I, Indaiatuba - SP. A Escola e a Oficina ficam na Alameda Comendador Dr. Santoro Mirone Pimenta, também em Indaiatuba.",
  },
  {
    id: "mudanca-de-nome",
    category: "institucional",
    question: "A Somos do Bem é a antiga APAE de Indaiatuba?",
    answer:
      "Sim. Em 14 de junho de 2023 a APAE de Indaiatuba anunciou publicamente seu novo nome e sua nova marca: Somos do Bem. É a mesma instituição, com a mesma equipe e os mesmos programas.",
  },
  {
    id: "como-doar",
    category: "doacao",
    question: "Como posso doar?",
    answer:
      "Pelo botão “Quero doar”, em qualquer página do site. É possível doar uma vez ou todo mês, e também destinar a doação a uma necessidade específica da associação.",
  },
  {
    id: "recibo",
    category: "doacao",
    question: "Recebo recibo da minha doação?",
    answer:
      "Sim. O recibo é emitido assim que o pagamento é confirmado e fica disponível para download. Cada recibo tem um código próprio que qualquer pessoa pode conferir na página “Verificar documento”, sem precisar de login.",
  },
  {
    id: "doacao-segura",
    category: "doacao",
    question: "Como sei que a minha doação chegou?",
    answer:
      "Depois do pagamento, o site acompanha a confirmação e só informa que a doação foi concluída quando o recebimento é confirmado de fato. Enquanto isso, a tela mostra que o pagamento está em processamento, nunca um “sucesso” antecipado.",
  },
  {
    id: "ser-voluntario",
    category: "voluntariado",
    question: "Como me torno voluntário?",
    answer:
      "Pelo cadastro em “Seja voluntário”, informando sua área, suas habilidades e sua disponibilidade. A equipe de voluntariado avalia o cadastro e entra em contato para os próximos passos.",
  },
  {
    id: "voluntario-horas",
    category: "voluntariado",
    question: "O voluntário recebe algum comprovante?",
    answer:
      "Sim. As horas de voluntariado ficam registradas no painel pessoal do voluntário, que pode emitir um certificado com o mesmo código de verificação pública usado nos recibos.",
  },
  {
    id: "transparencia",
    category: "institucional",
    question: "Onde vejo a prestação de contas?",
    answer:
      "Na página de Transparência, que reúne estatuto, certificações, demonstrações financeiras e relatórios de atividades. O Painel de Impacto mostra, em linguagem direta, quantas pessoas são atendidas em cada programa.",
  },
]

export async function listFaq(): Promise<FaqItem[]> {
  return FAQ
}
