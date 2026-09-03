import { CalendarDays, Coins, Megaphone, Package, ReceiptText, TriangleAlert } from "lucide-react"
import { Link } from "react-router-dom"
import { AdminPage, StatTile, TransactionStatusBadge } from "../../components/admin/admin-ui"
import { TYPE_LABEL } from "../../components/admin/transaction-labels"
import { CampaignProgress } from "../../components/campaign/campaign-progress"
import { ButtonLink } from "../../components/ui/button"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { useAdminTransactions } from "../../hooks/use-admin-transactions"
import { useAllCampaigns, useItemSummary } from "../../hooks/use-admin-catalog"
import { useSession } from "../../hooks/use-session"
import { sumConfirmed } from "../../services/admin/list-transactions-service"
import { formatCurrency, formatDate, formatNumber } from "../../utils/format"

// O painel geral responde a três perguntas, e só a três: o que entrou, o que
// está travado e onde está cada campanha. Painel que tenta responder tudo é
// painel que ninguém lê. Cada seção pertence a um papel, e some para quem não
// tem acesso à rota que a alimenta.
export default function DashboardPage() {
  const { user } = useSession()

  // O backend divide as rotas por papel, e a tela respeita a mesma divisão: o
  // Financeiro não enxerga `GET /campaign/list-all`, então pedir a lista de
  // campanhas no painel dele só produzia um 403 travestido de "as campanhas não
  // carregaram". Não é falha de leitura, é uma pergunta que não cabia fazer.
  const canSeeMoney = user?.role === "admin" || user?.role === "finance"
  const canSeeCatalogue = user?.role === "admin" || user?.role === "communication"

  const recent = useAdminTransactions({ page: 1 }, canSeeMoney)
  const pending = useAdminTransactions({ status: "pending", page: 1 }, canSeeMoney)
  const campaigns = useAllCampaigns(canSeeCatalogue)
  const items = useItemSummary(canSeeMoney)

  return (
    <AdminPage
      title={`Olá, ${user?.name.split(" ")[0] ?? "equipe"}`}
      description="O resumo do que está acontecendo agora. Os números abaixo dizem sempre de que recorte são, porque soma de tela nunca é relatório."
      action={
        <ButtonLink to="/" variant="outline" tone="ink" size="sm">
          Ver o site público
        </ButtonLink>
      }
    >
      {canSeeMoney && (
        <section aria-labelledby="numeros">
          <h2 id="numeros" className="sr-only">
            Números do momento
          </h2>

          {(recent.isPending || pending.isPending || items.isPending) && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-28 w-full" />
              ))}
            </div>
          )}

          {recent.isError && (
            <StateMessage
              tone="error"
              title="Os números não carregaram"
              description="Não conseguimos falar com a API agora. Os dados continuam no servidor: falhou só a leitura."
              action={
                <button
                  type="button"
                  onClick={() => recent.refetch()}
                  className="font-display font-bold text-primary underline underline-offset-4"
                >
                  Tentar de novo
                </button>
              }
            />
          )}

          {recent.data && pending.data && items.data && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile
                icon={ReceiptText}
                label="Transações"
                value={formatNumber(recent.data.total)}
                hint="Total de transações registradas, em todos os estados e períodos."
              />
              <StatTile
                icon={Coins}
                label="Soma desta página"
                value={formatCurrency(sumConfirmed(recent.data.transactions))}
                hint="Soma das confirmadas entre as 20 mais recentes. Não é a arrecadação do período."
              />
              <StatTile
                icon={TriangleAlert}
                label="Pendentes"
                value={formatNumber(pending.data.total)}
                hint="Aguardando confirmação do gateway. A reconciliação mostra as que travaram."
              />
              <StatTile
                icon={Package}
                label="Itens vendidos"
                value={formatCurrency(items.data.totals.revenue)}
                hint={`${formatNumber(items.data.totals.quantity)} unidades. Este vem somado pelo banco, então é o total de verdade.`}
              />
            </div>
          )}
        </section>
      )}

      {canSeeCatalogue && (
        <section aria-labelledby="campanhas" className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="campanhas" className="font-display text-xl font-bold">
              Campanhas
            </h2>
            <Link
              to="/admin/comunicacao/campanhas"
              className="text-sm font-bold text-primary underline underline-offset-4"
            >
              Gerenciar campanhas
            </Link>
          </div>

          {campaigns.isPending && <Skeleton className="h-40 w-full" />}

          {campaigns.isError && (
            <StateMessage
              tone="error"
              title="As campanhas não carregaram"
              description="Não conseguimos buscar as campanhas agora."
            />
          )}

          {campaigns.data && campaigns.data.length === 0 && (
            <StateMessage
              title="Nenhuma campanha cadastrada"
              description="Uma campanha dá destino à doação e mostra a meta subindo no site público."
            />
          )}

          {campaigns.data && campaigns.data.length > 0 && (
            <ul className="grid gap-4 md:grid-cols-2">
              {campaigns.data
                .filter((campaign) => campaign.status === "active")
                .map((campaign) => (
                  <li key={campaign.id} className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5">
                    <div className="flex items-start gap-3">
                      <Megaphone className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="font-display font-bold">{campaign.title}</p>
                        <p className="text-xs text-ink-soft">
                          Encerra em {campaign.ends_at ? formatDate(campaign.ends_at) : "data não definida"}
                        </p>
                      </div>
                    </div>
                    <CampaignProgress campaign={campaign} />
                  </li>
                ))}
            </ul>
          )}
        </section>
      )}

      {canSeeMoney && recent.data && recent.data.transactions.length > 0 && (
        <section aria-labelledby="recentes" className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="recentes" className="font-display text-xl font-bold">
              Movimento recente
            </h2>
            <Link
              to="/admin/financeiro/transacoes"
              className="text-sm font-bold text-primary underline underline-offset-4"
            >
              Ver todas as transações
            </Link>
          </div>

          <ul className="flex flex-col divide-y divide-line rounded-card border border-line bg-surface">
            {recent.data.transactions.slice(0, 6).map((transaction) => (
              <li key={transaction.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{transaction.donor?.name ?? "Doador não identificado"}</p>
                  <p className="text-xs text-ink-soft">
                    {TYPE_LABEL[transaction.type]} · {formatDate(transaction.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <TransactionStatusBadge status={transaction.status} />
                  <span className="font-display font-bold">{formatCurrency(transaction.amount)}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!canSeeMoney && (
        <section className="flex flex-col gap-4 rounded-card border border-line bg-surface p-6">
          <CalendarDays className="size-6 text-institutional-dark" aria-hidden="true" />
          <h2 className="font-display text-xl font-bold">Seu acesso é de Comunicação</h2>
          <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">
            Os números do caixa respondem ao perfil Financeiro. O que está no seu alcance é o que
            aparece no site: campanhas, eventos e produtos.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink to="/admin/comunicacao/campanhas" size="sm">
              Campanhas
            </ButtonLink>
            <ButtonLink to="/admin/comunicacao/eventos" size="sm" variant="outline" tone="ink">
              Eventos
            </ButtonLink>
            <ButtonLink to="/admin/comunicacao/produtos" size="sm" variant="outline" tone="ink">
              Produtos
            </ButtonLink>
          </div>
        </section>
      )}
    </AdminPage>
  )
}
