import { Reveal } from "../motion/reveal"

export type GovernanceRole = {
  position: string
  text: string
}

type GovernanceRolesProps = {
  roles: GovernanceRole[]
}

// A estrutura de governança é informação institucional e não depende de nome de
// pessoa: quais cargos existem e do que cada um responde é o que o visitante
// precisa para saber a quem se dirigir. Os retratos entram acima disto, pelo
// `PeopleBoard`, quando a associação envia a relação nominal.
export function GovernanceRoles({ roles }: GovernanceRolesProps) {
  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {roles.map((role, index) => (
        <li key={role.position}>
          <Reveal delay={index * 0.05} className="h-full">
            <div className="flex h-full flex-col gap-2 rounded-card border border-line bg-surface p-6">
              <h3 className="font-display text-lg font-bold">{role.position}</h3>
              <p className="text-sm leading-relaxed text-ink-soft">{role.text}</p>
            </div>
          </Reveal>
        </li>
      ))}
    </ul>
  )
}
