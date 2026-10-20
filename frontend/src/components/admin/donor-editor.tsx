import { useRef, useState } from "react"
import { flushSync } from "react-dom"
import type { FormEvent } from "react"
import { CheckoutError } from "../../config/errors"
import { useSaveDonor } from "../../hooks/use-admin-donors"
import type { AdminDonor } from "../../services/admin/list-donors-service"
import { Field, FieldRow, TextInput } from "../ui/field"
import { EditorPanel } from "./editor-panel"

type DonorEditorProps = {
  /** Ausente: cadastrar. Presente: corrigir o cadastro deste. */
  donor?: AdminDonor
  onDone: (message: string) => void
  onCancel: () => void
}

type Errors = Partial<Record<"name" | "email" | "phone" | "document", string>>

// Cadastro manual e correção de doador. O documento entra só no cadastro: é ele
// que liga a pessoa aos recibos já emitidos, então não muda depois.
export function DonorEditor({ donor, onDone, onCancel }: DonorEditorProps) {
  const [name, setName] = useState(donor?.name ?? "")
  const [email, setEmail] = useState(donor?.email ?? "")
  const [phone, setPhone] = useState(donor?.phone ?? "")
  const [document, setDocument] = useState("")
  const [errors, setErrors] = useState<Errors>({})

  const formRef = useRef<HTMLFormElement>(null)
  const save = useSaveDonor()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const digits = document.replace(/\D/g, "")
    const found: Errors = {}

    if (name.trim().length < 2) found.name = "Escreva o nome com pelo menos 2 letras."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) found.email = "Escreva um e-mail válido, como nome@provedor.com."
    if (phone.trim() && phone.trim().length < 8) found.phone = "O telefone precisa de pelo menos 8 dígitos."
    if (!donor && digits && digits.length !== 11 && digits.length !== 14) found.document = "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos)."

    flushSync(() => setErrors(found))

    const first = Object.keys(found)[0]

    if (first) {
      formRef.current?.querySelector<HTMLElement>(`#doador-${first}`)?.focus()
      return
    }

    const saved = await save
      .mutateAsync({
        id: donor?.id,
        input: { name: name.trim(), email: email.trim(), phone: phone.trim() || null },
        document: digits || null,
      })
      .catch(() => null)

    if (saved) {
      onDone(
        donor
          ? `O cadastro de ${saved.donor.name} foi atualizado.`
          : saved.created
            ? `${saved.donor.name} foi cadastrado.`
            : `${saved.donor.name} já tinha cadastro com este documento ou e-mail. Nada foi duplicado.`,
      )
    }
  }

  return (
    <EditorPanel
      id="editor-doador"
      title={donor ? "Editar doador" : "Cadastrar doador"}
      formRef={formRef}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      saving={save.isPending}
      submitLabel={donor ? "Salvar alterações" : "Cadastrar"}
      error={
        save.isError
          ? save.error instanceof CheckoutError
            ? save.error.message
            : "Não conseguimos falar com o servidor. Os dados continuam aqui, é só tentar de novo."
          : null
      }
    >
      <FieldRow>
        <Field id="doador-name" label="Nome" error={errors.name} required>
          {(control) => <TextInput {...control} autoComplete="off" value={name} onChange={(event) => setName(event.target.value)} maxLength={128} />}
        </Field>

        <Field id="doador-email" label="E-mail" error={errors.email} required>
          {(control) => (
            <TextInput {...control} type="email" autoComplete="off" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={128} />
          )}
        </Field>
      </FieldRow>

      <FieldRow>
        <Field id="doador-phone" label="Telefone" error={errors.phone}>
          {(control) => <TextInput {...control} type="tel" autoComplete="off" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={20} />}
        </Field>

        {!donor && (
          <Field id="doador-document" label="CPF ou CNPJ" error={errors.document}>
            {(control) => (
              <TextInput {...control} inputMode="numeric" autoComplete="off" value={document} onChange={(event) => setDocument(event.target.value)} maxLength={18} />
            )}
          </Field>
        )}
      </FieldRow>
    </EditorPanel>
  )
}
