import { Boxes, Package, Plus, TrendingUp } from "lucide-react"
import { useState } from "react"
import { AdminPage, StatTile } from "../../components/admin/admin-ui"
import { ConfirmDialog } from "../../components/admin/confirm-dialog"
import { DataList } from "../../components/admin/data-list"
import type { Column } from "../../components/admin/data-list"
import { ProductEditor } from "../../components/admin/product-editor"
import { Badge } from "../../components/ui/badge"
import { Button, ButtonLink } from "../../components/ui/button"
import { Field, TextInput } from "../../components/ui/field"
import { Skeleton, StateMessage } from "../../components/ui/states"
import { CheckoutError } from "../../config/errors"
import { useAllProducts, useCatalogAction, useItemSummary } from "../../hooks/use-admin-catalog"
import { useDeleteFromCatalog } from "../../hooks/use-catalog-editor"
import { useSession } from "../../hooks/use-session"
import { productPath } from "../../services/product/get-product-by-sku-service"
import type { Product } from "../../types/product-types"
import { formatCurrency, formatNumber } from "../../utils/format"

// Repor estoque é a edição que a loja mais pede: o estoque é debitado na
// confirmação do pagamento, então a prateleira esvazia sozinha e alguém tem que
// enchê-la de volta. Por isso ela mora na própria linha, e não no formulário.
//
// O formulário mora dentro da coluna "Estoque", e não na de ações. Ali o
// cabeçalho da tabela já diz o que o número é, então o rótulo pode ficar só para
// o leitor de tela, e a coluna de ações volta a ter a largura de botões em vez
// da largura de um formulário inteiro.
function StockForm({ product, disabled }: { product: Product; disabled: boolean }) {
  const [value, setValue] = useState(String(product.stock))
  const action = useCatalogAction()

  const changed = value !== String(product.stock)

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        const stock = Number(value)

        if (!Number.isInteger(stock) || stock < 0) return

        action.mutate({ domain: "product", action: "stock", id: product.id, stock })
      }}
      className="flex items-center gap-2"
    >
      <div className="w-20 shrink-0">
        <Field id={`estoque-${product.id}`} label={`Estoque de ${product.name}`} hideLabel>
          {(control) => (
            <TextInput
              {...control}
              type="number"
              min="0"
              step="1"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="min-h-10 px-3 py-1.5 text-sm"
            />
          )}
        </Field>
      </div>

      {/* O botão só aparece quando há o que salvar. Um "Salvar" permanente em
          cada linha enche a tabela de convite para uma ação que não foi pedida. */}
      {changed && (
        <Button type="submit" size="sm" variant="outline" tone="ink" disabled={disabled || action.isPending}>
          Salvar
        </Button>
      )}
    </form>
  )
}

type Editing = { mode: "new" } | { mode: "edit"; product: Product } | null

export default function ProductsPage() {
  const { user } = useSession()
  const [editing, setEditing] = useState<Editing>(null)
  const [removing, setRemoving] = useState<Product | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const removal = useDeleteFromCatalog()

  // Excluir é da administração, e só do produto que nunca entrou no catálogo:
  // nenhuma venda pode depender dele. O que já foi vendido sai por desativação.
  const isAdmin = user?.role === "admin"

  function open(next: Editing) {
    setNotice(null)
    setEditing(next)
  }

  function finish(message: string) {
    setEditing(null)
    setNotice(message)
  }

  function closeRemoval() {
    setRemoving(null)
    removal.reset()
  }

  // A receita de itens vem de `/transaction-item/summary`, que responde a
  // `admin` e `finance`. Esta tela é da Comunicação, então para ela o número não
  // existe: pedir e mostrar "não carregou" seria inventar uma falha.
  const canSeeMoney = user?.role === "admin" || user?.role === "finance"

  const { data, isPending, isError, refetch } = useAllProducts()
  const summary = useItemSummary(canSeeMoney)
  const action = useCatalogAction()

  const columns: Column<Product>[] = [
    { key: "name", header: "Produto", primary: true, cell: (row) => row.name },
    {
      key: "sku",
      header: "SKU",
      hideBelow: "xl",
      nowrap: true,
      cell: (row) => <span className="font-mono text-xs">{row.sku ?? "sem SKU"}</span>,
    },
    {
      key: "price",
      header: "Preço",
      nowrap: true,
      align: "right",
      cell: (row) => formatCurrency(row.price),
    },
    {
      key: "stock",
      header: "Estoque",
      nowrap: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <StockForm product={row} disabled={action.isPending} />
          {row.stock === 0 && <Badge tone="alert">Esgotado</Badge>}
          {row.active && row.stock > 0 && row.stock <= 10 && <Badge tone="reward">Baixo</Badge>}
        </div>
      ),
    },
    {
      key: "status",
      header: "Situação",
      nowrap: true,
      cell: (row) => (row.active ? <Badge tone="success">No catálogo</Badge> : <Badge tone="institutional">Fora</Badge>),
    },
  ]

  const active = data ? data.filter((product) => product.active).length : 0
  const low = data ? data.filter((product) => product.active && product.stock <= 10).length : 0

  return (
    <AdminPage
      title="Produtos"
      action={
        editing === null && (
          <Button size="sm" onClick={() => open({ mode: "new" })}>
            <Plus className="size-4" aria-hidden="true" />
            Novo produto
          </Button>
        )
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data && (
          <>
            <StatTile
              icon={Package}
              label="No catálogo"
              value={`${active} de ${data.length}`}
              hint="Na loja"
            />
            <StatTile
              icon={Boxes}
              label="Estoque baixo"
              value={String(low)}
              hint="10 unidades ou menos"
            />
          </>
        )}
        {summary.data && (
          <StatTile
            icon={TrendingUp}
            label="Receita de itens"
            value={formatCurrency(summary.data.totals.revenue)}
            hint={`${formatNumber(summary.data.totals.quantity)} unidades vendidas`}
          />
        )}
      </div>

      {notice && <StateMessage title="Pronto" description={notice} />}

      {editing && (
        <ProductEditor
          key={editing.mode === "edit" ? editing.product.id : "novo"}
          product={editing.mode === "edit" ? editing.product : undefined}
          onDone={finish}
          onCancel={() => setEditing(null)}
        />
      )}

      {action.isError && (
        <StateMessage
          tone="error"
          title="A operação não foi concluída"
          description={
            action.error instanceof CheckoutError
              ? action.error.message
              : "Não conseguimos falar com o servidor. Nada foi alterado."
          }
        />
      )}

      {isPending && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <StateMessage
          tone="error"
          title="O catálogo não carregou"
          description="Não conseguimos buscar os produtos agora."
          action={
            <button
              type="button"
              onClick={() => refetch()}
              className="font-display font-bold text-primary underline underline-offset-4"
            >
              Tentar de novo
            </button>
          }
        />
      )}

      {data && data.length === 0 && (
        <StateMessage
          title="Nenhum produto cadastrado"
          description="Nenhum produto cadastrado."
          action={
            <Button size="sm" onClick={() => open({ mode: "new" })}>
              Novo produto
            </Button>
          }
        />
      )}

      {data && data.length > 0 && (
        <div className="rounded-card border-line bg-surface lg:border lg:p-2">
          <DataList
            caption="Produtos da loja"
            columns={columns}
            rows={data}
            rowKey={(row) => row.id}
            breakpoint="xl"
            actions={(row) => (
              <>
                <Button size="sm" variant="outline" tone="ink" onClick={() => open({ mode: "edit", product: row })}>
                  Editar
                </Button>

                {row.active ? (
                  <Button
                    size="sm"
                    variant="outline"
                    tone="primary"
                    disabled={action.isPending}
                    onClick={() => action.mutate({ domain: "product", action: "deactivate", id: row.id })}
                  >
                    Tirar do catálogo
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={action.isPending}
                    onClick={() => action.mutate({ domain: "product", action: "activate", id: row.id })}
                  >
                    Colocar no catálogo
                  </Button>
                )}

                {row.active && (
                  <ButtonLink to={productPath(row)} size="sm" variant="outline" tone="ink">
                    Ver na loja
                  </ButtonLink>
                )}

                {isAdmin && row.activated_at === null && (
                  <Button size="sm" variant="outline" tone="primary" onClick={() => setRemoving(row)}>
                    Excluir
                  </Button>
                )}
              </>
            )}
          />
        </div>
      )}

      {removing && (
        <ConfirmDialog
          title={`Excluir "${removing.name}"?`}
          consequence="O produto nunca esteve no catálogo, então nenhuma venda depende dele. O cadastro é apagado de vez."
          confirmLabel="Excluir produto"
          pending={removal.isPending}
          error={removal.isError ? (removal.error instanceof CheckoutError ? removal.error.message : "Não conseguimos falar com o servidor. Nada foi apagado.") : null}
          onClose={closeRemoval}
          onConfirm={() =>
            removal.mutate(
              { domain: "product", id: removing.id },
              {
                onSuccess: () => {
                  setNotice(`"${removing.name}" foi excluído.`)
                  closeRemoval()
                },
              },
            )
          }
        />
      )}
    </AdminPage>
  )
}
