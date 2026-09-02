import type { Person } from "../../types/institutional-types"
import { Badge } from "../ui/badge"
import { Card, CardBody } from "../ui/card"
import { ImageSlot } from "../ui/image-slot"

type PersonCardProps = {
  person: Person
}

export function PersonCard({ person }: PersonCardProps) {
  return (
    <Card as="article" className="h-full">
      <ImageSlot
        src={person.photo}
        ratio="1/1"
        alt={person.name}
        hint={`Retrato de ${person.name}`}
      />

      <CardBody className="gap-2">
        <Badge tone="institutional">{person.position}</Badge>

        <h3 className="font-display text-lg leading-snug font-bold">{person.name}</h3>

        {person.term && <p className="text-sm text-ink-soft">Mandato {person.term}</p>}
      </CardBody>
    </Card>
  )
}
