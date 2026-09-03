import { Clock, Mail, MapPin, Phone } from "lucide-react"
import { Card } from "../ui/card"

// Os canais diretos aparecem nas três páginas de contato. São dado real da ONG,
// não exemplo: telefone, e-mail e os dois endereços publicados pela associação.
//
// A lista é de uma coluna só de propósito. Em duas colunas dentro da metade da
// página, o cartão fica com ~230px e o endereço de e-mail, que não tem onde
// quebrar, sai cortado. Endereço de contato cortado é pior do que uma lista
// mais alta.
const CHANNELS = [
  {
    icon: Phone,
    title: "Telefone",
    value: "(19) 3801-8890",
    href: "tel:+551938018890",
    wrap: false,
  },
  {
    icon: Mail,
    title: "E-mail",
    value: "contato@somosdobem.org.br",
    href: "mailto:contato@somosdobem.org.br",
    wrap: true,
  },
]

const UNITS = [
  {
    title: "Ambulatório e Administração",
    lines: ["Alameda da Criança, 100, Vila Vitória I", "Indaiatuba - SP, 13338-020"],
  },
  {
    title: "Escola e Oficina",
    lines: ["Alameda Comendador Dr. Santoro Mirone Pimenta", "Indaiatuba - SP, 13347-685"],
  },
]

export function ContactChannels() {
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-4">
        {CHANNELS.map((channel) => (
          <li key={channel.title}>
            <Card>
              <a href={channel.href} className="flex items-center gap-4 p-5 hover:bg-surface-muted">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-pill bg-primary-soft text-primary">
                  <channel.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <strong className="block font-display text-sm font-normal text-ink-soft">
                    {channel.title}
                  </strong>
                  <span
                    className={`font-display text-base font-bold text-ink sm:text-lg ${channel.wrap ? "break-all" : ""}`}
                  >
                    {channel.value}
                  </span>
                </span>
              </a>
            </Card>
          </li>
        ))}
      </ul>

      <ul className="flex flex-col gap-4">
        {UNITS.map((unit) => (
          <li key={unit.title}>
            <Card>
              <div className="flex gap-4 p-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-pill bg-institutional-soft text-institutional-dark">
                  <MapPin className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 text-sm leading-relaxed text-ink-soft">
                  <strong className="block font-display text-base text-ink">{unit.title}</strong>
                  {unit.lines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <p className="flex items-start gap-2 text-sm text-ink-soft">
        <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        O horário de atendimento de cada unidade é confirmado por telefone.
      </p>
    </div>
  )
}
