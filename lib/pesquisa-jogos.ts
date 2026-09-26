export type JogoCategoria = {
  categoria: string
  jogos: string[]
}

export const CATEGORIAS_JOGOS: JogoCategoria[] = [
  {
    categoria: "MOBA",
    jogos: ["League of Legends", "Dota 2", "Mobile Legends: Bang Bang", "Teamfight Tactics"],
  },
  {
    categoria: "Shooter Tático",
    jogos: ["Counter-Strike 2", "VALORANT", "Rainbow Six Siege", "Overwatch 2"],
  },
  {
    categoria: "Battle Royale",
    jogos: ["PUBG: Battlegrounds", "PUBG Mobile", "Free Fire", "Fortnite", "Apex Legends"],
  },
  {
    categoria: "Esportes & Arcade",
    jogos: ["Rocket League", "EA Sports FC 26", "Brawl Stars", "Call of Duty: Warzone"],
  },
  {
    categoria: "Fighting",
    jogos: ["Street Fighter 6", "Tekken 8", "Mortal Kombat 1"],
  },
]

// Lista achatada de todos os jogos válidos (para validação e filtros)
export const TODOS_OS_JOGOS: string[] = CATEGORIAS_JOGOS.flatMap((c) => c.jogos)

export type PesquisaLead = {
  id: string
  nome: string
  email: string
  telefone: string | null
  jogos_selecionados: string[]
  outros_jogos: string | null
  data_resposta: string
  status: string
}
