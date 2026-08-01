import { useState, useEffect } from 'react';
import { database } from '../../../services/database';
import { supabase } from '../../../services/supabase';
import { calculateBadges, type Badge } from '../../../utils/badges';

const GENRE_ADJECTIVES: Record<string, string> = {
  'Ação': 'Explosivo',
  'Comédia': 'Engraçado',
  'Terror': 'Destemido',
  'Ficção científica': 'Intergalático',
  'Romance': 'Apaixonado',
  'Animação': 'Divertido',
  'Drama': 'Dramático',
  'Thriller': 'Tenso',
  'Aventura': 'Aventureiro',
  'Fantasia': 'Místico',
  'Mistério': 'Detetive',
};

const EMOTION_PHRASES: Record<string, string> = {
  'Feliz': 'Você tem um espírito leve e busca a felicidade nas telonas!',
  'Empolgado': 'Adrenalina e empolgação movem o seu coração de cinéfilo!',
  'Inspirado': 'Você absorve o melhor das histórias para a sua própria vida.',
  'Nostálgico': 'Um clássico apaixonado pelos bons tempos do cinema.',
  'Apaixonado': 'O romance e as grandes paixões dominam suas sessões.',
  'Reflexivo': 'Você gosta de filmes que alugam um triplex na sua mente.',
  'Confuso': 'Suas escolhas são complexas e cheias de mistérios sem fim.',
  'Entediado': 'Talvez seja a hora de buscar novos gêneros para se animar!',
  'Cansado': 'O cinema é seu refúgio para relaxar e fugir da rotina.',
  'Relaxado': 'Você domina a arte de usar os filmes como pura terapia.',
  'Triste': 'Você não tem medo de derramar lágrimas por uma boa história.',
  'Assustado': 'Sua coragem é testada frequentemente pelos seus filmes!',
  'Tenso': 'Suspense e tensão são os combustíveis do seu entretenimento.',
  'Revoltado': 'Você se envolve de corpo e alma com as tramas.',
  'Decepção': 'Você tem um senso crítico extremamente aguçado.'
};

export function useHeroStats() {
  const [isLoading, setIsLoading] = useState(true);
  const [totalMoviesWatched, setTotalMoviesWatched] = useState(0);
  const [totalMinutesWatched, setTotalMinutesWatched] = useState(0);
  const [averageRating, setAverageRating] = useState('0.0');
  const [topGenres, setTopGenres] = useState<{name: string, count: number}[]>([]);
  const [radarEmotions, setRadarEmotions] = useState<{name: string, count: number, maxValue: number}[]>([]);
  const [realTopEmotions, setRealTopEmotions] = useState<{name: string, count: number}[]>([]);
  const [emotionPhrase, setEmotionPhrase] = useState('');
  const [gamificationTitle, setGamificationTitle] = useState('Analisando...');
  
  const [currentChallenge, setCurrentChallenge] = useState<any>(null);
  const [isChallengeCompleted, setIsChallengeCompleted] = useState(false);

  const [currentXp, setCurrentXp] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [nextLevelXp, setNextLevelXp] = useState(100);
  const [userBadges, setUserBadges] = useState<Badge[]>([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const challenge = await database.getWeeklyChallenge(session.user.id);
        setCurrentChallenge(challenge);
        const completed = await database.isWeeklyChallengeCompleted(session.user.id, challenge.weekId);
        setIsChallengeCompleted(completed);

        const fullList = await database.getWatchedMovies(session.user.id);
        const stats = await database.getUserStats(session.user.id);
        if (!stats) return;

        const watchedList = stats.watched || [];
        setTotalMoviesWatched(watchedList.length);
        
        const minutes = stats.watchTimeMinutes || watchedList.reduce((acc: number, movie: any) => acc + (movie.runtime || 0), 0);
        setTotalMinutesWatched(minutes);

        const genreCounts: Record<string, number> = {};
        const emotionCounts: Record<string, number> = {};
        let sumRating = 0;
        let countRating = 0;
        
        watchedList.forEach((movie: any) => {
          if (movie.genres && Array.isArray(movie.genres)) {
            movie.genres.forEach((g: any) => {
              genreCounts[g.name] = (genreCounts[g.name] || 0) + 1;
            });
          }
          
          if (movie.emotions && Array.isArray(movie.emotions)) {
            movie.emotions.forEach((em: string) => {
              // Extract the text part of the emotion (e.g. "🤯 Explodiu a cabeça" -> "Explodiu a cabeça")
              const match = em.match(/^(\S+)\s+(.+)$/);
              const name = match ? match[2] : em;
              emotionCounts[name] = (emotionCounts[name] || 0) + 1;
            });
          }

          if (movie.rating) {
            sumRating += movie.rating;
            countRating++;
          }
        });
        
        if (countRating > 0) {
          setAverageRating((sumRating / countRating).toFixed(1));
        }

        const sortedEmotions = Object.keys(emotionCounts)
          .map(name => ({ name, count: emotionCounts[name] }))
          .sort((a, b) => b.count - a.count);
          
        setRealTopEmotions(sortedEmotions.slice(0, 3));
        if (sortedEmotions.length > 0) {
          setEmotionPhrase(EMOTION_PHRASES[sortedEmotions[0].name] || 'Sua paleta de emoções é bem eclética!');
        } else {
          setEmotionPhrase('');
        }
          
        let radarData = sortedEmotions.slice(0, 6);
        const maxEmotionValue = Math.max(...radarData.map(e => e.count), 1);
        
        while(radarData.length > 0 && radarData.length < 6) {
          radarData.push({ name: '', count: 0 }); 
        }
        
        setRadarEmotions(radarData.map(e => ({...e, maxValue: maxEmotionValue})));

        const sortedGenres = Object.keys(genreCounts)
          .map(name => ({ name, count: genreCounts[name] }))
          .sort((a, b) => b.count - a.count);

        setTopGenres(sortedGenres.slice(0, 3));

        const hours = minutes / 60;
        let timeTitle = 'Espectador';
        if (hours > 10) timeTitle = 'Cinéfilo Casual';
        if (hours > 50) timeTitle = 'Cinéfilo Dedicado';
        if (hours > 100) timeTitle = 'Viciado em Filmes';
        if (hours > 200) timeTitle = 'Diretor Honorário';

        let genreAdjective = 'Eclético';
        if (sortedGenres.length > 0) {
          const topGenreName = sortedGenres[0].name;
          genreAdjective = GENRE_ADJECTIVES[topGenreName] || 'Eclético';
        }

        setGamificationTitle(`${timeTitle} ${genreAdjective}`);

        const calculatedXp = stats.xp || 0;
        const calculatedLevel = stats.level || Math.floor(calculatedXp / 100) + 1;
        const nextXp = calculatedLevel * 100;
        
        setCurrentXp(calculatedXp);
        setCurrentLevel(calculatedLevel);
        setNextLevelXp(nextXp);

        const newBadges = calculateBadges(watchedList.length, minutes);
        setUserBadges(newBadges);

      } catch (err) {
        console.error("Erro ao carregar status do herói", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  const formatWatchTime = (totalMinutes: number) => {
    if (totalMinutes === 0) return '0 min';

    const years = Math.floor(totalMinutes / (60 * 24 * 365));
    let remainder = totalMinutes % (60 * 24 * 365);
    
    const months = Math.floor(remainder / (60 * 24 * 30));
    remainder = remainder % (60 * 24 * 30);
    
    const weeks = Math.floor(remainder / (60 * 24 * 7));
    remainder = remainder % (60 * 24 * 7);
    
    const days = Math.floor(remainder / (60 * 24));
    remainder = remainder % (60 * 24);
    
    const hours = Math.floor(remainder / 60);
    const mins = remainder % 60;
    
    const parts = [];
    if (years > 0) parts.push(`${years}a`);
    if (months > 0) parts.push(`${months}mês`);
    if (weeks > 0) parts.push(`${weeks}sem`);
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0) parts.push(`${mins}min`);
    
    return parts.join(' ');
  };

  const formattedWatchTime = formatWatchTime(totalMinutesWatched);

  return {
    isLoading,
    totalMoviesWatched,
    averageRating,
    topGenres,
    radarEmotions,
    realTopEmotions,
    emotionPhrase,
    gamificationTitle,
    currentXp,
    currentLevel,
    nextLevelXp,
    userBadges,
    formattedWatchTime,
    currentChallenge,
    isChallengeCompleted,
  };
}
