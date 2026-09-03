import type { Person, PersonBoard } from "../../types/institutional-types"

// PROVISÓRIO E VAZIO DE PROPÓSITO.
//
// A composição da diretoria e dos conselhos é dado nominal de pessoas reais: não
// dá para preencher por dedução, nem para inventar cargo. Enquanto a ONG não
// enviar a lista, a página monta a estrutura inteira e mostra o estado vazio,
// que diz honestamente que a composição será publicada ali.
//
// Para preencher, basta acrescentar os objetos abaixo, e a página não muda:
//   { id: "1", name: "Nome Sobrenome", position: "Presidente",
//     board: "diretoria", term: "2024–2026",
//     photo: "/imagens/pessoas/nome-sobrenome.jpg" }
const PEOPLE: Person[] = []

export async function listPeople(board: PersonBoard): Promise<Person[]> {
  return PEOPLE.filter((person) => person.board === board)
}
