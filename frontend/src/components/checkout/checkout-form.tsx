import { Loader2, Lock } from "lucide-react"
import { useRef, useState } from "react"
import { flushSync } from "react-dom"
import { useCreateTransaction } from "../../hooks/use-create-transaction"
import { CheckoutError } from "../../config/errors"
import type { CreateTransactionInput, TransactionType } from "../../types/transaction-types"
import { formatCurrency } from "../../utils/format"
import { redirectTo } from "../../utils/redirect"
import { Button } from "../ui/button"
import { Field, TextInput } from "../ui/field"
import { StateMessage } from "../ui/states"

type CheckoutFormProps = {
  type: TransactionType
  /** O que está sendo pago, repetido no resumo para ninguém pagar às cegas. */
  title: string
  /** Preço de tabela. Presente em convite e produto; ausente em doação e patrocínio. */
  fixedAmount?: string
  presets?: number[]
  campaignId?: string | null
  eventId?: string | null
  items?: { product_id: string; quantity?: number }[]
  submitLabel: string
  disabled?: boolean
  disabledReason?: string
}

type Errors = Partial<Record<"amount" | "donor_name" | "donor_email" | "donor_document", string>>

const DIGITS = /\D/g

function onlyDigits(value: string): string {
  return value.replace(DIGITS, "")
}

// Documento é opcional, mas quando informado tem que ser um CPF ou um CNPJ pelo
// número de dígitos. A validação para aí de propósito: conferir dígito
// verificador aqui recusaria documento válido por causa de digitação e não
// impede nada, porque quem valida o recibo é o backend.
function validateDocument(value: string): string | undefined {
  if (value.trim().length === 0) return undefined

  const digits = onlyDigits(value)

  if (digits.length !== 11 && digits.length !== 14) {
    return "Informe um CPF (11 dígitos) ou um CNPJ (14 dígitos)."
  }

  return undefined
}

export function CheckoutForm({
  type,
  title,
  fixedAmount,
  presets,
  campaignId,
  eventId,
  items,
  submitLabel,
  disabled,
  disabledReason,
}: CheckoutFormProps) {
  const pricedByCatalogue = fixedAmount !== undefined

  const [amount, setAmount] = useState(presets ? String(presets[1] ?? presets[0] ?? "") : "")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [document, setDocument] = useState("")
  const [phone, setPhone] = useState("")
  const [errors, setErrors] = useState<Errors>({})

  const formRef = useRef<HTMLFormElement>(null)
  const checkout = useCreateTransaction()

  function validate(): Errors {
    const found: Errors = {}

    if (!pricedByCatalogue) {
      const value = Number(amount.replace(",", "."))

      if (!Number.isFinite(value) || value <= 0) {
        found.amount = "Informe um valor maior que zero."
      } else if (Math.round(value * 100) / 100 !== value) {
        found.amount = "O valor pode ter no máximo dois centavos."
      }
    }

    if (name.trim().length < 3) {
      found.donor_name = "Informe o nome completo, com pelo menos 3 letras."
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      found.donor_email = "Informe um e-mail válido, porque é para lá que o recibo vai."
    }

    const documentError = validateDocument(document)

    if (documentError) {
      found.donor_document = documentError
    }

    return found
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const found = validate()

    // `flushSync` porque a ordem importa: o foco só pode ir para o campo depois
    // que a mensagem de erro existir no DOM, senão o `aria-describedby` ainda
    // aponta para um elemento que não está lá e o leitor de tela anuncia o campo
    // sem dizer o que está errado. Sem isso a renderização acontece depois do
    // `focus()`, e sob carga ela chega a desfazê-lo.
    flushSync(() => setErrors(found))

    // Pintar de vermelho e deixar o foco onde estava obriga quem usa teclado ou
    // leitor de tela a caçar o campo errado. O foco vai para o primeiro deles.
    const first = Object.keys(found)[0]

    if (first) {
      formRef.current?.querySelector<HTMLElement>(`#checkout-${first}`)?.focus()
      return
    }

    const input: CreateTransactionInput = {
      type,
      // Convite e produto não mandam valor: o preço vem do catálogo, e o backend
      // responde 400 a um valor enviado. É o que impede comprar por um centavo.
      ...(pricedByCatalogue ? {} : { amount: Number(amount.replace(",", ".")) }),
      ...(items ? { items } : {}),
      campaign_id: campaignId ?? null,
      event_id: eventId ?? null,
      donor_name: name.trim(),
      donor_email: email.trim(),
      donor_document: document.trim().length > 0 ? onlyDigits(document) : null,
      donor_phone: phone.trim().length > 0 ? phone.trim() : null,
    }

    const transaction = await checkout.mutateAsync(input).catch(() => null)

    if (transaction?.checkout_url) {
      redirectTo(transaction.checkout_url)
    }
  }

  const total = pricedByCatalogue ? fixedAmount : amount.length > 0 ? amount.replace(",", ".") : null

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {!pricedByCatalogue && (
        <fieldset className="flex flex-col gap-4">
          <legend className="font-display text-lg font-bold">Quanto você quer doar?</legend>

          {presets && (
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => {
                const selected = Number(amount.replace(",", ".")) === preset

                return (
                  <Button
                    key={preset}
                    type="button"
                    size="sm"
                    tone="primary"
                    variant={selected ? "solid" : "outline"}
                    onClick={() => setAmount(String(preset))}
                    aria-pressed={selected}
                  >
                    {formatCurrency(preset)}
                  </Button>
                )
              })}
            </div>
          )}

          <Field
            id="checkout-amount"
            label="Valor da doação"
            hint="Em reais. Você pode escolher um valor acima ou digitar outro."
            error={errors.amount}
            required
          >
            {(control) => (
              <TextInput
                {...control}
                type="number"
                inputMode="decimal"
                min="1"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="100.00"
              />
            )}
          </Field>
        </fieldset>
      )}

      <fieldset className="flex flex-col gap-4">
        <legend className="font-display text-lg font-bold">Seus dados</legend>

        <p className="text-sm text-ink-soft">
          O recibo é emitido no nome de quem declara a doação, e não no do titular do cartão, e é por
          isso os dados vêm antes do pagamento.
        </p>

        <Field id="checkout-donor_name" label="Nome completo" error={errors.donor_name} required>
          {(control) => (
            <TextInput
              {...control}
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          )}
        </Field>

        <Field
          id="checkout-donor_email"
          label="E-mail"
          hint="Para onde enviamos a confirmação e o recibo."
          error={errors.donor_email}
          required
        >
          {(control) => (
            <TextInput
              {...control}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          )}
        </Field>

        <Field
          id="checkout-donor_document"
          label="CPF ou CNPJ"
          hint="Necessário para o recibo servir na declaração de imposto de renda."
          error={errors.donor_document}
        >
          {(control) => (
            <TextInput
              {...control}
              type="text"
              inputMode="numeric"
              value={document}
              onChange={(event) => setDocument(event.target.value)}
            />
          )}
        </Field>

        <Field id="checkout-donor_phone" label="Telefone">
          {(control) => (
            <TextInput
              {...control}
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          )}
        </Field>
      </fieldset>

      <div className="rounded-card border border-line bg-surface-muted p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-display font-bold">{title}</span>
          <span className="font-display text-2xl font-extrabold text-primary">
            {total ? formatCurrency(total) : "a definir"}
          </span>
        </div>
      </div>

      {checkout.isError && (
        <StateMessage
          tone="error"
          title={checkout.error instanceof CheckoutError ? "Não foi possível seguir" : "Algo deu errado"}
          description={
            checkout.error instanceof CheckoutError
              ? checkout.error.message
              : "Não conseguimos falar com o servidor agora. Tente de novo em instantes."
          }
        />
      )}

      {disabled && disabledReason && <StateMessage title="Indisponível" description={disabledReason} />}

      <Button type="submit" size="lg" fullWidth disabled={disabled || checkout.isPending}>
        {checkout.isPending ? (
          <>
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            Abrindo o pagamento…
          </>
        ) : (
          <>
            <Lock className="size-5" aria-hidden="true" />
            {submitLabel}
          </>
        )}
      </Button>

      <p className="text-center text-xs text-ink-soft">
        O pagamento acontece no ambiente do Stripe. A associação não recebe nem guarda o número do
        seu cartão.
      </p>
    </form>
  )
}
