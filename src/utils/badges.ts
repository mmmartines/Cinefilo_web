export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
}

export function calculateBadges(totalMovies: number, totalMinutes: number): Badge[] {
  const allBadges: Badge[] = [
    // Conquistas por quantidade de filmes (15)
    { id: 'movies_1', name: 'Primeiro Passo', description: 'Assistiu ao seu primeiro filme.', icon: 'film', color: '#4CAF50', unlocked: totalMovies >= 1 },
    { id: 'movies_5', name: 'Aprendiz', description: 'Assistiu 5 filmes.', icon: 'glasses', color: '#00BCD4', unlocked: totalMovies >= 5 },
    { id: 'movies_10', name: 'Cinemaníaco', description: 'Assistiu 10 filmes.', icon: 'videocam', color: '#2196F3', unlocked: totalMovies >= 10 },
    { id: 'movies_25', name: 'Entusiasta', description: 'Assistiu 25 filmes.', icon: 'heart', color: '#E91E63', unlocked: totalMovies >= 25 },
    { id: 'movies_50', name: 'Crítico de Sofá', description: 'Assistiu 50 filmes.', icon: 'star', color: '#9C27B0', unlocked: totalMovies >= 50 },
    { id: 'movies_75', name: 'Pipoca de Bronze', description: 'Assistiu 75 filmes.', icon: 'medal', color: '#CD7F32', unlocked: totalMovies >= 75 },
    { id: 'movies_100', name: 'Pipoca de Prata', description: 'Assistiu 100 filmes.', icon: 'medal', color: '#C0C0C0', unlocked: totalMovies >= 100 },
    { id: 'movies_150', name: 'Pipoca de Ouro', description: 'Assistiu 150 filmes.', icon: 'medal', color: '#FFD700', unlocked: totalMovies >= 150 },
    { id: 'movies_200', name: 'Cinéfilo Mestre', description: 'Assistiu 200 filmes.', icon: 'ribbon', color: '#FF5722', unlocked: totalMovies >= 200 },
    { id: 'movies_250', name: 'Rato de Cinema', description: 'Assistiu 250 filmes.', icon: 'ticket', color: '#8BC34A', unlocked: totalMovies >= 250 },
    { id: 'movies_300', name: 'Especialista', description: 'Assistiu 300 filmes.', icon: 'book', color: '#3F51B5', unlocked: totalMovies >= 300 },
    { id: 'movies_400', name: 'Crítico Respeitado', description: 'Assistiu 400 filmes.', icon: 'chatbubbles', color: '#009688', unlocked: totalMovies >= 400 },
    { id: 'movies_500', name: 'Lenda Viva', description: 'Assistiu 500 filmes.', icon: 'trophy', color: '#E50914', unlocked: totalMovies >= 500 },
    { id: 'movies_750', name: 'Mestre da 7ª Arte', description: 'Assistiu 750 filmes.', icon: 'planet', color: '#673AB7', unlocked: totalMovies >= 750 },
    { id: 'movies_1000', name: 'Imortal do Cinema', description: 'Assistiu 1000 filmes.', icon: 'diamond', color: '#000000', unlocked: totalMovies >= 1000 },

    // Conquistas por tempo assistido (15)
    { id: 'time_120', name: 'Um Filme e Meio', description: '2 horas de tela (120 min).', icon: 'time', color: '#FFEB3B', unlocked: totalMinutes >= 120 },
    { id: 'time_300', name: 'Tarde Chuvosa', description: '5 horas de tela (300 min).', icon: 'cafe', color: '#795548', unlocked: totalMinutes >= 300 },
    { id: 'time_600', name: 'Hora da Pipoca', description: '10 horas de tela (600 min).', icon: 'fast-food', color: '#FF9800', unlocked: totalMinutes >= 600 },
    { id: 'time_1440', name: 'Maratonista', description: '24 horas de tela.', icon: 'timer', color: '#F44336', unlocked: totalMinutes >= 1440 },
    { id: 'time_3000', name: 'Sem Dormir', description: '50 horas de tela.', icon: 'bed', color: '#9E9E9E', unlocked: totalMinutes >= 3000 },
    { id: 'time_6000', name: 'Diretor de Fotografia', description: '100 horas de tela.', icon: 'camera', color: '#2196F3', unlocked: totalMinutes >= 6000 },
    { id: 'time_9000', name: 'Assinatura Premium', description: '150 horas de tela.', icon: 'card', color: '#4CAF50', unlocked: totalMinutes >= 9000 },
    { id: 'time_12000', name: 'Poltrona VIP', description: '200 horas de tela.', icon: 'star-half', color: '#FFC107', unlocked: totalMinutes >= 12000 },
    { id: 'time_18000', name: 'Cadeira de Diretor', description: '300 horas de tela.', icon: 'images', color: '#E91E63', unlocked: totalMinutes >= 18000 },
    { id: 'time_24000', name: 'Tapete Vermelho', description: '400 horas de tela.', icon: 'footsteps', color: '#E50914', unlocked: totalMinutes >= 24000 },
    { id: 'time_30000', name: 'Olhos Quadrados', description: '500 horas de tela.', icon: 'tv', color: '#00BCD4', unlocked: totalMinutes >= 30000 },
    { id: 'time_42000', name: 'Vivendo no Cinema', description: '700 horas de tela.', icon: 'home', color: '#8BC34A', unlocked: totalMinutes >= 42000 },
    { id: 'time_60000', name: 'Um Ano de Pipoca', description: '1000 horas de tela.', icon: 'calendar', color: '#9C27B0', unlocked: totalMinutes >= 60000 },
    { id: 'time_90000', name: 'Especialista em Telas', description: '1500 horas de tela.', icon: 'laptop', color: '#3F51B5', unlocked: totalMinutes >= 90000 },
    { id: 'time_120000', name: 'A Arte do Tempo', description: '2000 horas de tela.', icon: 'hourglass', color: '#FFD700', unlocked: totalMinutes >= 120000 },
  ];

  return allBadges;
}
