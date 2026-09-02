import { CircleAlert } from "lucide-react"
import { PageHero } from "../../components/layout/page-hero"
import { ReadingModeToggle } from "../../components/layout/reading-mode-toggle"
import { ButtonLink } from "../../components/ui/button"
import { Container } from "../../components/ui/container"
import { Prose } from "../../components/ui/prose"

const SECTIONS = [
  {
    title: "Quais dados o site coleta",
    paragraphs: [
      "Ao doar, o site pede nome e documento (CPF ou CNPJ) antes do pagamento. Esses dados são necessários porque é o nome informado que sai no recibo, e é o documento informado que permite abater a doação no Imposto de Renda — não os dados de quem passou o cartão, que podem ser de outra pessoa.",
      "Ao enviar uma mensagem por qualquer formulário do site, o texto é montado no seu próprio programa de e-mail e enviado por você. O site não guarda cópia dessa mensagem.",
      "Preferências de navegação, como o Modo Leitura Fácil, ficam salvas apenas no seu navegador e não são enviadas para lugar nenhum.",
    ],
  },
  {
    title: "O que acontece com o pagamento",
    paragraphs: [
      "O pagamento é processado por um provedor externo de pagamentos, em página hospedada por ele. Dados de cartão não passam por este site nem são armazenados pela associação.",
    ],
  },
  {
    title: "Por quanto tempo os dados ficam guardados",
    paragraphs: [
      "Dados ligados a recibos e certificados precisam ser mantidos pelos prazos legais de guarda de documentos fiscais e contábeis, porque são a prova da doação tanto para o doador quanto para a prestação de contas da associação.",
    ],
  },
  {
    title: "Seus direitos",
    paragraphs: [
      "A Lei Geral de Proteção de Dados garante a você o direito de saber quais dados a associação tem sobre você, de corrigi-los e de pedir a exclusão daqueles que não precisam ser mantidos por obrigação legal. O pedido pode ser feito pelo e-mail contato@somosdobem.org.br.",
    ],
  },
]

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Institucional"
        title="Política de Privacidade"
        breadcrumb={[{ label: "Política de Privacidade" }]}
        action={<ReadingModeToggle tone="ink" />}
        lead={<p>O que este site coleta, por que coleta e o que você pode pedir a respeito.</p>}
      />

      <section className="py-16 sm:py-20">
        <Container className="max-w-3xl">
          <p className="flex items-start gap-3 rounded-card border-2 border-alert bg-alert/15 p-5 text-sm leading-relaxed text-ink">
            <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <span>
              <strong className="block font-display">Texto pendente de validação jurídica</strong>
              O conteúdo abaixo descreve com precisão o que o sistema faz hoje, mas ainda não foi
              revisado pela assessoria jurídica da associação. Ele não deve ser publicado como
              política oficial antes dessa revisão.
            </span>
          </p>

          <div className="mt-10 flex flex-col gap-10">
            {SECTIONS.map((section) => (
              <div key={section.title}>
                <h2 className="font-display text-2xl font-extrabold">{section.title}</h2>

                <Prose className="mt-4">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </Prose>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to="/fale-conosco">Falar sobre meus dados</ButtonLink>
            <ButtonLink to="/transparencia" variant="outline">
              Ver transparência
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  )
}
