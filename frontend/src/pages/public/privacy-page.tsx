import { PageHero } from "../../components/layout/page-hero"
import { ReadingModeToggle } from "../../components/layout/reading-mode-toggle"
import { ButtonLink } from "../../components/ui/button"
import { Container } from "../../components/ui/container"
import { Prose } from "../../components/ui/prose"

const SECTIONS = [
  {
    title: "Quais dados o site coleta",
    paragraphs: [
      "Ao doar, o site pede nome e documento (CPF ou CNPJ) antes do pagamento. Esses dados são necessários porque é o nome informado que sai no recibo, e é o documento informado que permite abater a doação no Imposto de Renda, e não os dados de quem passou o cartão, que podem ser de outra pessoa.",
      "Ao escrever pelo Fale Conosco, pela Ouvidoria ou pelo Trabalhe Conosco, ou ao pedir a retirada do seu nome do Mural do Bem, o site guarda o nome, o e-mail, o telefone (se você informar) e a mensagem, para que a equipe leia e responda. Só a equipe da associação vê essas mensagens, e as da ouvidoria e as candidaturas ficam só com a coordenação.",
      "Ao se inscrever num evento gratuito, o site guarda o nome, o e-mail e o telefone (se você informar) para a lista de presença daquele evento. A página do seu ingresso mostra só o seu nome.",
      "O cadastro de voluntário é montado no seu próprio programa de e-mail e enviado por você. O site não guarda cópia dele.",
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
          <div className=" flex flex-col gap-10">
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
