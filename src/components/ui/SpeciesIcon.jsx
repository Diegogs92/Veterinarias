import { Dog, Cat, Bird, Rabbit, Fish, Squirrel, PawPrint } from 'lucide-react'

const MAP = {
  perro:   Dog,
  gato:    Cat,
  pajaro:  Bird,
  conejo:  Rabbit,
  pez:     Fish,
  hamster: Squirrel,
  tortuga: PawPrint,
  otro:    PawPrint,
}

export default function SpeciesIcon({ species, size = 20, strokeWidth = 1.75, ...props }) {
  const Icon = MAP[species?.toLowerCase()] ?? PawPrint
  return <Icon size={size} strokeWidth={strokeWidth} {...props} />
}
