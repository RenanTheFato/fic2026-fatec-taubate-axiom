import type { Person, PersonBoard } from "../../types/institutional-types"

// A composição informada pela associação. Nome e cargo são dado nominal de
// pessoas reais: nada aqui é deduzido, e o que a associação não informou fica
// `null` em vez de preenchido por suposição, que é o caso do mandato hoje.
//
// A mesma pessoa aparece nos dois colegiados quando ela ocupa cargo eleito e
// pasta nomeada, e são dois registros: a página mostra cada colegiado no seu
// lugar, e uma entrada só teria de escolher qual dos dois cargos esconder.
//
// Para publicar o retrato de alguém: salve o arquivo em `public/imagens/pessoas/`
// (quadrado, lado mínimo de 480px) e troque o `null` pelo caminho, por exemplo
// `/imagens/pessoas/amadeu-tachinardi-rocha.jpg`. Sem arquivo, o `<ImageSlot>`
// mostra o lugar reservado na mesma proporção, então publicar a foto depois não
// mexe no layout.
const PEOPLE: Person[] = [
  {
    id: "1",
    name: "Amadeu Tachinardi Rocha",
    position: "Presidente",
    board: "diretoria-eleita",
    term: null,
    photo: null,
  },
  {
    id: "2",
    name: "Felipe de Vechi Pacioni",
    position: "Vice-Presidente",
    board: "diretoria-eleita",
    term: null,
    photo: null,
  },
  {
    id: "3",
    name: "Fernando Dias Raimundo",
    position: "Secretário",
    board: "diretoria-eleita",
    term: null,
    photo: null,
  },
  {
    id: "4",
    name: "Alexandre Eduardo Silva Oliveira",
    position: "Vice-Secretário",
    board: "diretoria-eleita",
    term: null,
    photo: null,
  },
  {
    id: "5",
    name: "Victor Gonçalves Hipólito",
    position: "Tesoureiro",
    board: "diretoria-eleita",
    term: null,
    photo: null,
  },
  {
    id: "6",
    name: "Fábio Jung Diegues",
    position: "Vice-Tesoureiro",
    board: "diretoria-eleita",
    term: null,
    photo: null,
  },
  {
    id: "7",
    name: "Victor Gonçalves Hipólito",
    position: "Diretor de Planejamento",
    board: "diretoria-nomeada",
    term: null,
    photo: null,
  },
  {
    id: "8",
    name: "Homero Lara da Silva",
    position: "Diretor da Saúde e RH",
    board: "diretoria-nomeada",
    term: null,
    photo: null,
  },
  {
    id: "9",
    name: "Rafael Katsuji Ohori",
    position: "Diretor de Educação e Comunicação",
    board: "diretoria-nomeada",
    term: null,
    photo: null,
  },
  {
    id: "10",
    name: "Felipe de Vechi Pacioni",
    position: "Diretor da Oficina Terapêutica e Patrimônio",
    board: "diretoria-nomeada",
    term: null,
    photo: null,
  },
  {
    id: "11",
    name: "Fernando Dias Raimundo",
    position: "Diretor de Eventos",
    board: "diretoria-nomeada",
    term: null,
    photo: null,
  },
  {
    id: "12",
    name: "Alexandre Eduardo Silva Oliveira",
    position: "Diretor da Assistência Social",
    board: "diretoria-nomeada",
    term: null,
    photo: null,
  },
  {
    id: "13",
    name: "Fábio Jung Diegues",
    position: "Diretor de Tecnologia",
    board: "diretoria-nomeada",
    term: null,
    photo: null,
  },
]

export async function listPeople(board: PersonBoard): Promise<Person[]> {
  return PEOPLE.filter((person) => person.board === board)
}
