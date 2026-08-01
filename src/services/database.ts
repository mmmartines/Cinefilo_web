const AsyncStorage = {
  getItem: async (key: string) => window.localStorage.getItem(key),
  setItem: async (key: string, value: string) => window.localStorage.setItem(key, value),
  removeItem: async (key: string) => window.localStorage.removeItem(key)
};
import { supabase } from './supabase';

const USERS_KEY = '@cinefilo_users';
const CURRENT_USER_KEY = '@cinefilo_current_user';
const AVATAR_KEY = '@cinefilo_avatar';
const STATS_KEY = '@cinefilo_stats';
const API_URL = 'https://cinefilo-server.vercel.app';

const WEEKLY_CHALLENGES = [
  { id: 0, title: 'Ficção e Ciência', desc: 'Assista a 1 Filme de Ficção Científica', xp: 500, targetGenre: 'Ficção científica' },
  { id: 1, title: 'Risadas Garantidas', desc: 'Assista a 1 Filme de Comédia', xp: 400, targetGenre: 'Comédia' },
  { id: 2, title: 'Noite de Terror', desc: 'Assista a 1 Filme de Terror', xp: 500, targetGenre: 'Terror' },
  { id: 3, title: 'Ação Pura', desc: 'Assista a 1 Filme de Ação', xp: 400, targetGenre: 'Ação' },
  { id: 4, title: 'Mundo Animado', desc: 'Assista a 1 Animação', xp: 300, targetGenre: 'Animação' },
  { id: 5, title: 'Suspense Total', desc: 'Assista a 1 Thriller', xp: 400, targetGenre: 'Thriller' },
  { id: 6, title: 'Amor no Ar', desc: 'Assista a 1 Filme de Romance', xp: 300, targetGenre: 'Romance' },
  { id: 7, title: 'Aventura Épica', desc: 'Assista a 1 Filme de Aventura', xp: 400, targetGenre: 'Aventura' },
  { id: 8, title: 'Drama Emocionante', desc: 'Assista a 1 Filme de Drama', xp: 300, targetGenre: 'Drama' },
  { id: 9, title: 'Mistério Sem Fim', desc: 'Assista a 1 Filme de Mistério', xp: 500, targetGenre: 'Mistério' },
];

type AuthListener = (user: any) => void;
const authListeners: AuthListener[] = [];

export const database = {
  subscribeAuth(listener: AuthListener) {
    authListeners.push(listener);
    return () => {
      const index = authListeners.indexOf(listener);
      if (index > -1) {
        authListeners.splice(index, 1);
      }
    };
  },

  notifyAuthListeners(user: any) {
    authListeners.forEach(listener => listener(user));
  },

  async getWeeklyChallenge(userId: string) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    const weekId = `${d.getUTCFullYear()}_W${weekNo}`;

    // Tenta recuperar desafio salvo desta semana
    const savedChallengeStr = await AsyncStorage.getItem(`@cinefilo_current_challenge_${userId}_${weekId}`);
    if (savedChallengeStr) {
      return JSON.parse(savedChallengeStr);
    }

    // Se não tem, gera um novo
    const prefs = await this.getPreferences(userId);
    let selectedChallenge = null;

    if (prefs.genres.length > 0) {
      // 1. Desafio de Zona de Conforto (Favorito)
      // Escolhe um gênero favorito aleatório usando a semana como "semente"
      const genreId = prefs.genres[weekNo % prefs.genres.length];
      
      // Busca os gêneros no AsyncStorage (cache) ou fallback pra nomes locais
      const genresMap: Record<number, string> = {
        28: 'Ação', 12: 'Aventura', 16: 'Animação', 35: 'Comédia', 80: 'Crime', 99: 'Documentário', 18: 'Drama', 10751: 'Família', 14: 'Fantasia', 36: 'História', 27: 'Terror', 10402: 'Música', 9648: 'Mistério', 10749: 'Romance', 878: 'Ficção científica', 10770: 'Cinema TV', 53: 'Thriller', 10752: 'Guerra', 37: 'Faroeste'
      };
      
      const genreName = genresMap[genreId] || 'Favorito';

      selectedChallenge = {
        id: `dyn_${weekId}`,
        title: 'Zona de Conforto',
        desc: `Assista a 1 filme do seu gênero favorito: ${genreName}`,
        xp: 600,
        targetGenre: genreName
      };
    } else {
      // Fallback global
      const challengeIndex = weekNo % WEEKLY_CHALLENGES.length;
      selectedChallenge = WEEKLY_CHALLENGES[challengeIndex];
    }

    const finalChallenge = {
      weekId,
      ...selectedChallenge
    };

    await AsyncStorage.setItem(`@cinefilo_current_challenge_${userId}_${weekId}`, JSON.stringify(finalChallenge));
    return finalChallenge;
  },

  async isWeeklyChallengeCompleted(userId: string, weekId: string) {
    const key = `@cinefilo_challenges_${userId}`;
    const data = await AsyncStorage.getItem(key);
    const completed = data ? JSON.parse(data) : [];
    return completed.includes(weekId);
  },

  async getBonusXp(userId: string) {
    const key = `@cinefilo_bonus_xp_${userId}`;
    const data = await AsyncStorage.getItem(key);
    return data ? parseInt(data) : 0;
  },

  async checkAndCompleteChallenge(userId: string, movieGenres: any[]) {
    const challenge = await this.getWeeklyChallenge(userId);
    const isCompleted = await this.isWeeklyChallengeCompleted(userId, challenge.weekId);
    
    if (isCompleted) return;

    // Checa se algum genero do filme bate com o targetGenre
    const hasTargetGenre = movieGenres.some((g: any) => g.name === challenge.targetGenre);
    
    if (hasTargetGenre) {
      const key = `@cinefilo_challenges_${userId}`;
      const data = await AsyncStorage.getItem(key);
      const completed = data ? JSON.parse(data) : [];
      completed.push(challenge.weekId);
      await AsyncStorage.setItem(key, JSON.stringify(completed));

      const currentBonus = await this.getBonusXp(userId);
      await AsyncStorage.setItem(`@cinefilo_bonus_xp_${userId}`, String(currentBonus + challenge.xp));

      // Força a subida das conquistas e XP para a nuvem
      await this.fullSync(userId);

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        fetch(`${API_URL}/api/feed`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            action: 'challenge_completed',
            challenge_title: challenge.title,
            challenge_xp: challenge.xp
          })
        }).catch(console.error);
      }
    }
  },

  // Retorna todos os usuários cadastrados
  async getUsers() {
    try {
      const usersJson = await AsyncStorage.getItem(USERS_KEY);
      return usersJson ? JSON.parse(usersJson) : [];
    } catch (e) {
      console.error('Erro ao ler usuários', e);
      return [];
    }
  },

  // Cadastra um novo usuário
  async registerUser(userData: any) {
    try {
      const users = await this.getUsers();

      // Verifica se já existe email
      if (users.find((u: any) => u.email === userData.email)) {
        throw new Error('E-mail já cadastrado.');
      }

      const newUser = { id: Date.now().toString(), nickname: '', ...userData };
      users.push(newUser);

      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));

      // Já loga o usuário automaticamente ao cadastrar
      await this.setCurrentUser(newUser);
      return newUser;
    } catch (e) {
      console.error('Erro ao cadastrar', e);
      throw e;
    }
  },

  // Realiza Login
  async login(email: string, pass: string) {
    try {
      const users = await this.getUsers();
      const user = users.find((u: any) => u.email === email);

      if (!user) {
        throw new Error('Usuário não encontrado. Por favor, faça seu cadastro.');
      }

      if (user.password !== pass) {
        throw new Error('Senha incorreta.');
      }

      await this.setCurrentUser(user);
      return user;
    } catch (e) {
      throw e;
    }
  },

  // Atualiza um usuário existente
  async updateUser(updatedData: any) {
    try {
      const users = await this.getUsers();
      const index = users.findIndex((u: any) => u.email === updatedData.email);

      if (index !== -1) {
        // Preserva o email e mescla os novos dados
        users[index] = { ...users[index], ...updatedData };
        await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
      }

      // Sempre atualiza a sessão atual se for o usuário logado
      const currentUser = await this.getCurrentUser();
      if (currentUser && currentUser.email === updatedData.email) {
        const newCurrentUser = { ...currentUser, ...updatedData };
        await this.setCurrentUser(newCurrentUser);
        return newCurrentUser;
      }

      if (index !== -1) return users[index];
      return null;
    } catch (e) {
      console.error('Erro ao atualizar usuário', e);
      throw e;
    }
  },

  // Login Social Simulado (Mock)
  async socialLoginMock(provider: string) {
    const mockUser = {
      id: `social_${Date.now()}`,
      name: `Usuário via ${provider}`,
      email: `user@${provider.toLowerCase()}.com`,
      provider,
      nickname: ''
    };
    await this.setCurrentUser(mockUser);
    return mockUser;
  },

  // Salva a sessão atual
  async setCurrentUser(user: any) {
    try {
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      this.notifyAuthListeners(user);
    } catch (e) {
      console.error('Erro ao salvar sessão', e);
    }
  },

  // Retorna o usuário logado atualmente (usado para verificar se pula o login)
  async getCurrentUser() {
    try {
      const userJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
      if (!userJson) return null;
      
      let user = JSON.parse(userJson);
      
      if (user.nickname === undefined) {
        user.nickname = '';
        await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      }
      
      return user;
    } catch (e) {
      console.error('Erro em getCurrentUser', e);
      return null;
    }
  },

  // Desloga
  async logout() {
    supabase.auth.signOut().catch(e => console.error('Erro supabase logout', e));
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
    await AsyncStorage.removeItem(AVATAR_KEY);
    this.notifyAuthListeners(null);
  },

  // --- FILMES ASSISTIDOS ---

  // Sincronização global (baixar e subir)
  async fullSync(userId: string) {
    try {
      await this.syncCloudToLocal(userId);
      await this.syncStatsToCloud(userId);
    } catch (e) {
      console.error('Erro no fullSync:', e);
    }
  },

  async getWatchedMovies(userId: string) {
    try {
      const watchedJson = await AsyncStorage.getItem(`@cinefilo_watched_${userId}`);
      return watchedJson ? JSON.parse(watchedJson) : [];
    } catch (e) {
      console.error('Erro ao ler filmes assistidos', e);
      return [];
    }
  },

  async getUserStats(userId: string) {
    try {
      const watchedList = await this.getWatchedMovies(userId);
      const watched = watchedList.filter((m: any) => m.status === 'watched').map((m: any) => m.movieId || m.id);
      const watchlist = watchedList.filter((m: any) => m.status === 'watchlist').map((m: any) => m.movieId || m.id);
      
      const total_movies = watched.length;
      const total_minutes = watchedList.filter((m: any) => m.status === 'watched').reduce((acc: number, curr: any) => acc + (curr.runtime || 0), 0);
      
      const bonusXpStr = await AsyncStorage.getItem(`@cinefilo_bonus_xp_${userId}`);
      const bonusXp = bonusXpStr ? parseInt(bonusXpStr) : 0;
      
      const listsStr = await AsyncStorage.getItem(`@cinefilo_lists_${userId}`);
      const userLists = listsStr ? JSON.parse(listsStr) : [];
      
      const calculatedXp = (total_movies * 10) + (userLists.length * 50) + bonusXp;
      const level = Math.floor(calculatedXp / 100) + 1;
      
      return {
        watched,
        watchlist,
        total_movies,
        total_minutes,
        xp: calculatedXp,
        level,
        bonus_xp: bonusXp
      };
    } catch (e) {
      console.error(e);
      return { watched: [], watchlist: [], total_movies: 0, total_minutes: 0, xp: 0, level: 1, bonus_xp: 0 };
    }
  },

  async syncStatsToCloud(userId: string, retries = 3) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const watchedList = await this.getWatchedMovies(userId);
      const watchedOnly = watchedList.filter((m: any) => m.status === 'watched');
      
      const total_movies = watchedOnly.length;
      const total_minutes = watchedOnly.reduce((acc: number, curr: any) => acc + (curr.runtime || 0), 0);

      const avatarUrl = await AsyncStorage.getItem(AVATAR_KEY);
      const pushToken = await AsyncStorage.getItem('expo_push_token');
      const notifsStr = await AsyncStorage.getItem('notifications_enabled');
      const challengesStr = await AsyncStorage.getItem(`@cinefilo_challenges_${userId}`);
      const bonusXpStr = await AsyncStorage.getItem(`@cinefilo_bonus_xp_${userId}`);
      const listsStr = await AsyncStorage.getItem(`@cinefilo_lists_${userId}`);
      const userLists = listsStr ? JSON.parse(listsStr) : [];
      const favGenresStr = await AsyncStorage.getItem(`@cinefilo_fav_genres_${userId}`);
      const favProvidersStr = await AsyncStorage.getItem(`@cinefilo_fav_providers_${userId}`);
      
      let friendsCount = 0;
      try {
        const friendsRes = await fetch(`${API_URL}/api/friends`, { headers: { 'Authorization': `Bearer ${session.access_token}` } });
        if (friendsRes.ok) {
           const result = await friendsRes.json();
           friendsCount = (result.data || []).length;
        }
      } catch (e) {}

      const bonusXp = bonusXpStr ? parseInt(bonusXpStr) : 0;
      const calculatedXp = (total_movies * 10) + (userLists.length * 50) + (friendsCount * 20) + bonusXp;
      const calculatedLevel = Math.floor(calculatedXp / 100) + 1;

      const payload: any = {
        total_movies,
        total_minutes,
        watched_movies: watchedList,
        completed_challenges: challengesStr ? JSON.parse(challengesStr) : [],
        bonus_xp: bonusXp,
        level: calculatedLevel,
        xp: calculatedXp,
        favorite_genres: favGenresStr ? JSON.parse(favGenresStr) : [],
        favorite_providers: favProvidersStr ? JSON.parse(favProvidersStr) : []
      };

      if (avatarUrl && !avatarUrl.startsWith('file://')) payload.avatar_url = avatarUrl;
      if (pushToken) payload.expo_push_token = pushToken;
      if (notifsStr !== null) payload.notifications_enabled = notifsStr === 'true';

      const response = await fetch(`${API_URL}/api/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Erro API ${response.status}: ${errText}`);
      }
    } catch (e) {
      console.error(`Erro ao sincronizar stats (Restam ${retries} tentativas):`, e);
      if (retries > 0) {
        setTimeout(() => {
          this.syncStatsToCloud(userId, retries - 1);
        }, 5000); // Retenta em 5 segundos
      }
    }
  },

  async syncCloudToLocal(userId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${API_URL}/api/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const { data: cloudProfile } = await response.json();

        // Faz o Merge Bidirecional dos filmes Assistidos
        if (cloudProfile.watched_movies) {
          const localWatchedStr = await AsyncStorage.getItem(`@cinefilo_watched_${userId}`);
          const localWatched = localWatchedStr ? JSON.parse(localWatchedStr) : [];
          
          const mergedMoviesMap = new Map();
          
          // Adiciona os locais
          localWatched.forEach((m: any) => {
            const id = m.movieId || m.id;
            mergedMoviesMap.set(id, m);
          });
          
          // Adiciona ou sobrescreve com os da nuvem (nuvem é a fonte primária aqui no startup, 
          // mas como vamos forçar internet em tudo, a nuvem sempre estará atualizada)
          cloudProfile.watched_movies.forEach((m: any) => {
            const id = m.movieId || m.id;
            if (!mergedMoviesMap.has(id) || new Date(m.added_at) > new Date(mergedMoviesMap.get(id).added_at || 0)) {
              mergedMoviesMap.set(id, m);
            }
          });
          
          const mergedMovies = Array.from(mergedMoviesMap.values());
          await AsyncStorage.setItem(`@cinefilo_watched_${userId}`, JSON.stringify(mergedMovies));
        }

        // Faz o Merge Bidirecional das Listas Personalizadas se existirem
        const listsResponse = await fetch(`${API_URL}/api/lists`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (listsResponse.ok) {
          const listsResult = await listsResponse.json();
          const cloudLists = listsResult.data || [];
          
          const localListsStr = await AsyncStorage.getItem(`@cinefilo_lists_${userId}`);
          const localLists = localListsStr ? JSON.parse(localListsStr) : [];
          
          const mergedListsMap = new Map();
          localLists.forEach((l: any) => mergedListsMap.set(l.id, l));
          cloudLists.forEach((cloudList: any) => {
            const localList = mergedListsMap.get(cloudList.id);
            if (!localList) {
              mergedListsMap.set(cloudList.id, cloudList);
            } else {
              // Merge dos filmes dentro da lista para nao perder adicoes offline
              const mergedMoviesMap = new Map();
              (localList.movies || []).forEach((m: any) => mergedMoviesMap.set(m.movieId || m.id, m));
              (cloudList.movies || []).forEach((m: any) => mergedMoviesMap.set(m.movieId || m.id, m));
              
              mergedListsMap.set(cloudList.id, {
                ...cloudList,
                movies: Array.from(mergedMoviesMap.values()),
                name: localList.name !== cloudList.name && !cloudList.name ? localList.name : cloudList.name
              });
            }
          });
          
          await AsyncStorage.setItem(`@cinefilo_lists_${userId}`, JSON.stringify(Array.from(mergedListsMap.values())));
        }

        // Sincroniza campos básicos do perfil
        if (cloudProfile.avatar_url) await AsyncStorage.setItem(AVATAR_KEY, cloudProfile.avatar_url);
        if (cloudProfile.expo_push_token) await AsyncStorage.setItem('expo_push_token', cloudProfile.expo_push_token);
        if (cloudProfile.notifications_enabled !== undefined) await AsyncStorage.setItem('notifications_enabled', String(cloudProfile.notifications_enabled));
        
        // Atualiza a nickname local se vier da nuvem
        if (cloudProfile.nickname !== undefined) {
           const currentUserJson = await AsyncStorage.getItem(CURRENT_USER_KEY);
           if (currentUserJson) {
             const user = JSON.parse(currentUserJson);
             user.nickname = cloudProfile.nickname;
             await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
           }
        }
        
        // Merge de Challenges e XP
        if (cloudProfile.completed_challenges) {
           const localChallStr = await AsyncStorage.getItem(`@cinefilo_challenges_${userId}`);
           const localChall = localChallStr ? JSON.parse(localChallStr) : [];
           const mergedChall = Array.from(new Set([...localChall, ...cloudProfile.completed_challenges]));
           await AsyncStorage.setItem(`@cinefilo_challenges_${userId}`, JSON.stringify(mergedChall));
        }

        if (cloudProfile.bonus_xp !== undefined) {
           const localXpStr = await AsyncStorage.getItem(`@cinefilo_bonus_xp_${userId}`);
           const localXp = localXpStr ? parseInt(localXpStr) : 0;
           const mergedXp = Math.max(localXp, cloudProfile.bonus_xp);
           await AsyncStorage.setItem(`@cinefilo_bonus_xp_${userId}`, String(mergedXp));
        }
        
        if (cloudProfile.favorite_genres) {
          await AsyncStorage.setItem(`@cinefilo_fav_genres_${userId}`, JSON.stringify(cloudProfile.favorite_genres));
        }
        if (cloudProfile.favorite_providers) {
          await AsyncStorage.setItem(`@cinefilo_fav_providers_${userId}`, JSON.stringify(cloudProfile.favorite_providers));
        }
        
        return {
          id: cloudProfile.id,
          name: cloudProfile.name,
          nickname: cloudProfile.nickname,
          avatar_url: cloudProfile.avatar_url,
          notifications_enabled: cloudProfile.notifications_enabled,
          stats: cloudProfile.stats,
          watched_movies: cloudProfile.watched_movies,
          favorite_genres: cloudProfile.favorite_genres || [],
          favorite_providers: cloudProfile.favorite_providers || []
        };
      }
    } catch (e) {
      console.error('Erro ao sincronizar nuvem para o local', e);
    }
  },

  async saveWatchedMovie(userId: string, movie: any, rating: number, review: string, runtime: number, emotions: string[] = [], status: 'watched' | 'watchlist' = 'watched', hasSpoiler: boolean = false) {
    try {
      const watched = await this.getWatchedMovies(userId);

      const movieData = {
        movieId: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        rating,
        review,
        runtime: runtime || 0,
        genres: movie.genres || [],
        emotions,
        status,
        addedAt: new Date().toISOString()
      };

      const existingIndex = watched.findIndex((m: any) => m.movieId === movie.id);

      if (existingIndex >= 0) {
        watched[existingIndex] = { ...watched[existingIndex], ...movieData };
      } else {
        watched.push(movieData);

        const currentUser = await this.getCurrentUser();
        if (currentUser && currentUser.id === userId && status === 'watched') {
          const currentTotal = currentUser.stats?.total_minutes || 0;
          await this.updateUser({
            email: currentUser.email,
            totalWatchedMinutes: currentTotal + (runtime || 0)
          });
        }
      }

      await AsyncStorage.setItem(`@cinefilo_watched_${userId}`, JSON.stringify(watched));

      if (status === 'watched') {
        await this.fullSync(userId);
        
        // Verifica se concluiu o desafio semanal com esse filme
        if (movieData.genres.length > 0) {
           await this.checkAndCompleteChallenge(userId, movieData.genres);
        }

        // Dispara o feed (fire and forget)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          fetch(`${API_URL}/api/feed`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              movie: movieData,
              action: rating > 0 || review ? 'rated' : 'watched',
              rating,
              review,
              has_spoiler: hasSpoiler
            })
          }).catch(console.error);
        }
      }

      return movieData;
    } catch (e) {
      console.error('Erro ao salvar filme assistido', e);
      throw e;
    }
  },

  async removeWatchedMovie(userId: string, movieId: number) {
    try {
      const watched = await this.getWatchedMovies(userId);
      const movieToRemove = watched.find((w: any) => w.movieId === movieId);

      if (!movieToRemove) return;

      const newWatched = watched.filter((w: any) => w.movieId !== movieId);
      await AsyncStorage.setItem(`@cinefilo_watched_${userId}`, JSON.stringify(newWatched));

      const currentUser = await this.getCurrentUser();
      if (currentUser && currentUser.id === userId && movieToRemove.status === 'watched') {
        const currentTotal = currentUser.stats?.total_minutes || 0;
        const newTotal = Math.max(0, currentTotal - (movieToRemove.runtime || 0));
        await this.updateUser({
          email: currentUser.email,
          totalWatchedMinutes: newTotal
        });
      }

      if (movieToRemove.status === 'watched') {
        await this.fullSync(userId);
      }
    } catch (e) {
      console.error('Erro ao remover filme assistido', e);
      throw e;
    }
  },

  async getCustomLists(userId: string) {
    try {
      const listsJson = await AsyncStorage.getItem(`@cinefilo_lists_${userId}`);
      let localLists = listsJson ? JSON.parse(listsJson) : [];

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const response = await fetch(`${API_URL}/api/lists`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (response.ok) {
          const result = await response.json();
          localLists = result.data || [];
          await AsyncStorage.setItem(`@cinefilo_lists_${userId}`, JSON.stringify(localLists));
        }
      }

      return localLists;
    } catch (e) {
      console.error('Erro ao buscar listas customizadas', e);
      const listsJson = await AsyncStorage.getItem(`@cinefilo_lists_${userId}`);
      return listsJson ? JSON.parse(listsJson) : [];
    }
  },

  async createCustomList(userId: string, listName: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let createdOnCloud = false;

      if (session) {
        try {
          const response = await fetch(`${API_URL}/api/lists`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ name: listName })
          });
          if (response.ok) createdOnCloud = true;
        } catch (err) {
          console.warn('Backend unavailable, creating list locally.');
        }
      }

      if (!createdOnCloud) {
        const listsJson = await AsyncStorage.getItem(`@cinefilo_lists_${userId}`);
        const localLists = listsJson ? JSON.parse(listsJson) : [];
        localLists.push({ id: `local_${Date.now()}`, name: listName, movies: [] });
        await AsyncStorage.setItem(`@cinefilo_lists_${userId}`, JSON.stringify(localLists));
      }

      await this.getCustomLists(userId);
      return true;
    } catch (e) {
      console.error('Erro ao criar lista', e);
      throw e;
    }
  },

  async addMovieToCustomList(userId: string, listId: string, movie: any) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let addedOnCloud = false;

      if (session && !String(listId).startsWith('local_')) {
        try {
          const response = await fetch(`${API_URL}/api/lists?action=movies`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              list_id: listId,
              movie: {
                movieId: movie.id,
                title: movie.title,
                poster_path: movie.poster_path,
                backdrop_path: movie.backdrop_path
              }
            })
          });
          if (response.ok) addedOnCloud = true;
        } catch (err) {
          console.warn('Backend unavailable, adding movie locally.');
        }
      }

      if (!addedOnCloud) {
        const listsJson = await AsyncStorage.getItem(`@cinefilo_lists_${userId}`);
        const localLists = listsJson ? JSON.parse(listsJson) : [];
        const listIndex = localLists.findIndex((l: any) => l.id === listId || l._id === listId);
        if (listIndex >= 0) {
          if (!localLists[listIndex].movies) localLists[listIndex].movies = [];
          if (!localLists[listIndex].movies.find((m: any) => m.movieId === movie.id)) {
            localLists[listIndex].movies.push({
              movieId: movie.id,
              title: movie.title,
              poster_path: movie.poster_path,
              backdrop_path: movie.backdrop_path
            });
            await AsyncStorage.setItem(`@cinefilo_lists_${userId}`, JSON.stringify(localLists));
          }
        }
      }

      await this.getCustomLists(userId);
      return true;
    } catch (e) {
      console.error('Erro ao adicionar em lista', e);
      throw e;
    }
  },

  async removeMovieFromCustomList(userId: string, listId: string, movieId: number) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let removedOnCloud = false;

      if (session && !String(listId).startsWith('local_')) {
        try {
          const response = await fetch(`${API_URL}/api/lists?action=movies`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ list_id: listId, movie: { movieId } })
          });
          if (response.ok) removedOnCloud = true;
        } catch (err) {
          console.warn('Backend unavailable, removing movie locally.');
        }
      }

      if (!removedOnCloud) {
        const listsJson = await AsyncStorage.getItem(`@cinefilo_lists_${userId}`);
        const localLists = listsJson ? JSON.parse(listsJson) : [];
        const listIndex = localLists.findIndex((l: any) => l.id === listId || l._id === listId);
        if (listIndex >= 0 && localLists[listIndex].movies) {
          localLists[listIndex].movies = localLists[listIndex].movies.filter((m: any) => m.movieId !== movieId);
          await AsyncStorage.setItem(`@cinefilo_lists_${userId}`, JSON.stringify(localLists));
        }
      }

      await this.getCustomLists(userId);
      return true;
    } catch (e) {
      console.error('Erro ao remover filme da lista', e);
      throw e;
    }
  },

  async shareCustomList(userId: string, listId: string, friendNickname: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${API_URL}/api/list_share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ list_id: listId, friend_nickname: friendNickname })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Falha ao compartilhar lista');

      return true;
    } catch (e: any) {
      console.error('Erro ao compartilhar lista', e);
      throw e;
    }
  },

  async updateAvatar(url: string) {
    await AsyncStorage.setItem(AVATAR_KEY, url);
    const user = await this.getCurrentUser();
    if (user) {
      user.avatar_url = url;
      await this.setCurrentUser(user);
      await this.fullSync(user.id);
    }
  },

  async updateNotificationPreferences(enabled: boolean) {
    await AsyncStorage.setItem('notifications_enabled', String(enabled));
    const user = await this.getCurrentUser();
    if (user) await this.fullSync(user.id);
  },

  async savePushToken(token: string) {
    await AsyncStorage.setItem('expo_push_token', token);
    const user = await this.getCurrentUser();
    if (user) await this.fullSync(user.id);
  },

  async createChatGroup(movieId: number, movieTitle: string, moviePoster: string, friends: { id: string, name: string }[], userName: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');
      const userId = session.user.id;

      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .insert([{ movie_id: movieId, movie_title: movieTitle, movie_poster: moviePoster, created_by: userId }])
        .select()
        .single();

      if (chatError) throw chatError;

      const members = [
        { chat_id: chatData.id, user_id: userId, user_name: userName },
        ...friends.map(f => ({ chat_id: chatData.id, user_id: f.id, user_name: f.name }))
      ];

      const { error: membersError } = await supabase
        .from('chat_members')
        .insert(members);

      if (membersError) throw membersError;

      return chatData;
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  async getChats() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const { data, error } = await supabase
        .from('chat_members')
        .select(`
          chat_id,
          chats (
            id,
            movie_id,
            movie_title,
            movie_poster,
            created_at
          )
        `)
        .eq('user_id', session.user.id)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      return data.map(d => d.chats);
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getMessages(chatId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async sendMessage(chatId: string, content: string, userName: string, userAvatar?: string | null) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const { error } = await supabase
        .from('messages')
        .insert([{
          chat_id: chatId,
          user_id: session.user.id,
          user_name: userName,
          user_avatar: userAvatar || null,
          content: content
        }]);

      if (error) throw error;

      // Dispara notificações push via Vercel (fire-and-forget)
      fetch(`${API_URL}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          chat_id: chatId,
          content: content,
          sender_name: userName
        })
      }).catch(console.error);

      return true;
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  subscribeToMessages(chatId: string, callback: (message: any) => void) {
    const channel = supabase
      .channel(`chat_${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload) => callback(payload.new)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

      // --- MATCH DE FILMES ---
  async saveMovieMatch(friendId: string, movieId: number, action: 'liked' | 'passed') {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const response = await fetch(`${API_URL}/api/social?route=swipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ friendId, movieId, action })
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar match');
      }

      const result = await response.json();
      return { isMatch: result.isMatch };
    } catch (e) {
      console.error('Erro ao salvar match', e);
      return { isMatch: false };
    }
  },

  async removeCustomList(userId: string, listId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && !listId.startsWith('local_')) {
        try {
          await fetch(`${API_URL}/api/lists`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ id: listId })
          });
        } catch (err) {
          console.warn('Erro ao deletar lista na nuvem');
        }
      }

      // Remover do AsyncStorage
      const listsJson = await AsyncStorage.getItem(`@cinefilo_lists_${userId}`);
      if (listsJson) {
        let localLists = JSON.parse(listsJson);
        localLists = localLists.filter((l: any) => String(l.id || l._id) !== String(listId));
        await AsyncStorage.setItem(`@cinefilo_lists_${userId}`, JSON.stringify(localLists));
      }
      return true;
    } catch (e) {
      console.error('Erro ao deletar lista', e);
      throw e;
    }
  },

  async renameCustomList(userId: string, listId: string, newName: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && !listId.startsWith('local_')) {
        try {
          await fetch(`${API_URL}/api/lists`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ id: listId, name: newName })
          });
        } catch (err) {
          console.warn('Erro ao renomear lista na nuvem');
        }
      }

      // Atualizar no AsyncStorage
      const listsJson = await AsyncStorage.getItem(`@cinefilo_lists_${userId}`);
      if (listsJson) {
        const localLists = JSON.parse(listsJson);
        const index = localLists.findIndex((l: any) => String(l.id || l._id) === String(listId));
        if (index > -1) {
          localLists[index].name = newName;
          await AsyncStorage.setItem(`@cinefilo_lists_${userId}`, JSON.stringify(localLists));
        }
      }
      return true;
    } catch (e) {
      console.error('Erro ao renomear lista', e);
      throw e;
    }
  },

  async updatePreferences(genres: number[], providers: number[]) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;
      await AsyncStorage.setItem(`@cinefilo_fav_genres_${userId}`, JSON.stringify(genres));
      await AsyncStorage.setItem(`@cinefilo_fav_providers_${userId}`, JSON.stringify(providers));
      this.syncStatsToCloud(userId);
    } catch (e) {
      console.error('Erro ao atualizar preferências:', e);
    }
  },

  async getPreferences(userId: string) {
    try {
      const favGenresStr = await AsyncStorage.getItem(`@cinefilo_fav_genres_${userId}`);
      const favProvidersStr = await AsyncStorage.getItem(`@cinefilo_fav_providers_${userId}`);
      return {
        genres: favGenresStr ? JSON.parse(favGenresStr) : [],
        providers: favProvidersStr ? JSON.parse(favProvidersStr) : []
      };
    } catch (e) {
      return { genres: [], providers: [] };
    }
  }

};
