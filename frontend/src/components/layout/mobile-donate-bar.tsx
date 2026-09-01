import { Heart } from "lucide-react"
import { ButtonLink } from "../ui/button"

// "Quero doar" nunca entra no menu recolhido. No celular ele vira barra fixa,
// porque é a ação mais importante do site e não pode depender de o visitante
// abrir o hambúrguer para encontrá-la.
export function MobileDonateBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 p-3 backdrop-blur sm:hidden">
      <ButtonLink to="/doe-agora" size="lg" fullWidth>
        <Heart className="size-5" aria-hidden="true" />
        Quero doar
      </ButtonLink>
    </div>
  )
}
