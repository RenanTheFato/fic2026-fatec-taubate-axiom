import { useRef, useState } from "react"
import { flushSync } from "react-dom"
import type { FormEvent } from "react"
import { CheckoutError } from "../../config/errors"
import { useSaveProduct } from "../../hooks/use-catalog-editor"
import type { Product } from "../../types/product-types"
import { parseMoneyInput, toMoneyInput } from "../../utils/form-input"
import { Field, FieldRow, TextArea, TextInput } from "../ui/field"
import { EditorPanel } from "./editor-panel"
import { PhotoField } from "./photo-field"

type ProductEditorProps = {
  /** Ausente: cadastrar. Presente: editar este. */
  product?: Product
  onDone: (message: string) => void
  onCancel: () => void
}

type Errors = Partial<Record<"name" | "sku" | "price" | "stock", string>>

// Cadastro e edição de produto da loja. O produto novo nasce fora do catálogo;
// "Colocar no catálogo", na lista, é o que o põe à venda. O estoque inicial
// entra aqui, e depois disso a reposição é a coluna "Estoque" da lista.
export function ProductEditor({ product, onDone, onCancel }: ProductEditorProps) {
  const [name, setName] = useState(product?.name ?? "")
  const [sku, setSku] = useState(product?.sku ?? "")
  const [description, setDescription] = useState(product?.description ?? "")
  const [price, setPrice] = useState(toMoneyInput(product?.price ?? null))
  const [stock, setStock] = useState("0")
  const [image, setImage] = useState<string | null>(product?.image_url ?? null)
  const [errors, setErrors] = useState<Errors>({})

  const formRef = useRef<HTMLFormElement>(null)
  const save = useSaveProduct()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const amount = parseMoneyInput(price)
    const units = Number(stock)
    const code = sku.trim().toLowerCase()
    const found: Errors = {}

    if (name.trim().length < 2) found.name = "Escreva um nome com pelo menos 2 letras."
    if (code && !/^[a-z0-9-]{2,64}$/.test(code)) found.sku = "Use de 2 a 64 letras sem acento, números e hífen."
    if (amount === null || amount <= 0) found.price = "Informe o preço em reais, como 45 ou 45,90."
    if (!product && (!Number.isInteger(units) || units < 0)) found.stock = "O estoque é um número inteiro, zero ou mais."

    flushSync(() => setErrors(found))

    const first = Object.keys(found)[0]

    if (first) {
      formRef.current?.querySelector<HTMLElement>(`#produto-${first}`)?.focus()
      return
    }

    const saved = await save
      .mutateAsync({
        id: product?.id,
        name: name.trim(),
        sku: code || null,
        description: description.trim() || null,
        price: amount as number,
        image_url: image,
        ...(product ? {} : { stock: units }),
      })
      .catch(() => null)

    if (saved) {
      onDone(product ? `"${saved.name}" foi atualizado.` : `"${saved.name}" foi cadastrado fora do catálogo. Coloque no catálogo para pôr à venda.`)
    }
  }

  return (
    <EditorPanel
      id="editor-produto"
      title={product ? "Editar produto" : "Novo produto"}
      formRef={formRef}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      saving={save.isPending}
      submitLabel={product ? "Salvar alterações" : "Cadastrar produto"}
      error={
        save.isError
          ? save.error instanceof CheckoutError
            ? save.error.message
            : "Não conseguimos falar com o servidor. Os dados continuam aqui, é só tentar de novo."
          : null
      }
    >
      <FieldRow>
        <Field id="produto-name" label="Nome" error={errors.name} required>
          {(control) => <TextInput {...control} value={name} onChange={(event) => setName(event.target.value)} maxLength={128} />}
        </Field>

        <Field id="produto-sku" label="SKU" hint="Vira o endereço do produto na loja." error={errors.sku}>
          {(control) => <TextInput {...control} value={sku} onChange={(event) => setSku(event.target.value)} maxLength={64} />}
        </Field>
      </FieldRow>

      <Field id="produto-description" label="Descrição">
        {(control) => (
          <TextArea {...control} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2048} />
        )}
      </Field>

      <FieldRow>
        <Field id="produto-price" label="Preço (R$)" error={errors.price} required>
          {(control) => <TextInput {...control} inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} />}
        </Field>

        {!product && (
          <Field id="produto-stock" label="Estoque inicial" error={errors.stock} required>
            {(control) => (
              <TextInput {...control} type="number" min="0" step="1" value={stock} onChange={(event) => setStock(event.target.value)} />
            )}
          </Field>
        )}
      </FieldRow>

      <PhotoField id="produto-foto" value={image} onChange={setImage} ratio="1/1" hint="Foto do produto em fundo claro" />
    </EditorPanel>
  )
}
