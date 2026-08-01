// Utilitário temporário para persistir listas no LocalStorage até o login com Vercel/AstraDB estar pronto na Web.

export const getLocalList = (listName: 'watchlist' | 'watched') => {
  const data = localStorage.getItem(`cinelandia_${listName}`);
  return data ? JSON.parse(data) : [];
};

export const isInList = (listName: 'watchlist' | 'watched', movieId: number) => {
  const list = getLocalList(listName);
  return list.some((m: any) => m.id === movieId);
};

export const toggleInList = (listName: 'watchlist' | 'watched', movie: any) => {
  let list = getLocalList(listName);
  const exists = list.find((m: any) => m.id === movie.id);
  
  if (exists) {
    list = list.filter((m: any) => m.id !== movie.id);
  } else {
    // Salvar apenas os dados essenciais para o MovieCard
    list.push({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
      release_date: movie.release_date
    });
  }
  
  localStorage.setItem(`cinelandia_${listName}`, JSON.stringify(list));
  return !exists; // Retorna true se adicionou, false se removeu
};
