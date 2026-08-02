import { useEffect, useState, useRef } from 'react';
import { PageHeader } from '../../../components/PageHeader';
import { getTrendingMovies, getUpcomingMovies, getNowPlayingMovies, fetchFilteredMovies, getGenres, getWatchProviders } from '../../../services/api';
import { MovieCard } from '../../../components/MovieCard';
import { supabase } from '../../../services/supabase';
import { database } from '../../../services/database';
import { Search, SlidersHorizontal, X, Loader2 } from 'lucide-react';
import { CinemasMap } from './CinemasMap';

type Tab = 'trending' | 'upcoming' | 'cinemas';

export function CatalogHome() {
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searching, setSearching] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const [activeTab, setActiveTab] = useState<Tab>('trending');
  const [userStats, setUserStats] = useState({ watched: [] as number[], watchlist: [] as number[] });
  
  const [query, setQuery] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [genres, setGenres] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<number[]>([]);

  useEffect(() => {
    async function loadInitial() {
      const g = await getGenres();
      const p = await getWatchProviders();
      setGenres(g || []);
      setProviders((p || []).slice(0, 30));
    }
    loadInitial();
  }, []);

  useEffect(() => {
    async function loadStats() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const stats = await database.getUserStats(session.user.id);
        if (stats) {
          setUserStats({
            watched: stats.watched || [],
            watchlist: stats.watchlist || []
          });
        }
      }
    }
    loadStats();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setMovies([]);
  }, [activeTab, query, selectedGenres, selectedProviders]);

  useEffect(() => {
    const isFiltering = query.trim() !== '' || selectedGenres.length > 0 || selectedProviders.length > 0;
    
    const delayDebounceFn = setTimeout(async () => {
      try {
        if (page === 1) {
          if (isFiltering) setSearching(true);
          else setLoading(true);
        } else {
          setLoadingMore(true);
        }

        let data;
        if (isFiltering) {
          data = await fetchFilteredMovies(page, query, selectedGenres, '', selectedProviders);
        } else {
          if (activeTab === 'trending') data = await getTrendingMovies(page);
          else if (activeTab === 'upcoming') data = await getUpcomingMovies(page);
          // Cinemas fetching is removed as it's now a map
        }
        
        if (data && data.length > 0) {
          setMovies(prev => page === 1 ? data : [...prev, ...data]);
        } else {
          setHasMore(false);
        }
      } catch (error) {
        console.error("Failed to fetch movies", error);
      } finally {
        setLoading(false);
        setSearching(false);
        setLoadingMore(false);
      }
    }, isFiltering && page === 1 ? 500 : 0);

    return () => clearTimeout(delayDebounceFn);
  }, [page, activeTab, query, selectedGenres, selectedProviders]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && !loadingMore && hasMore) {
        setPage(p => p + 1);
      }
    }, { threshold: 0.1 });

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    return () => observer.disconnect();
  }, [loading, loadingMore, hasMore]);

  const toggleGenre = (id: number) => {
    setSelectedGenres(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  };

  const toggleProvider = (id: number) => {
    setSelectedProviders(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };
  
  const isFiltering = query.trim() !== '' || selectedGenres.length > 0 || selectedProviders.length > 0;

  return (
    <div className="animate-fade-in" style={{ padding: '0 16px', position: 'relative' }}>
      <PageHeader 
        title="Catálogo 🍿" 
        subtitle="Descubra o que o mundo está assistindo." 
      />

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--color-border)', borderRadius: '12px', padding: '0 16px', height: '48px' }}>
          <Search size={20} color="var(--color-text-muted)" style={{ marginRight: '12px' }} />
          <input
            type="text"
            placeholder="Buscar filmes, séries..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#FAFAFA', fontSize: '16px', outline: 'none' }}
          />
          {searching && <Loader2 size={20} color="var(--color-text-muted)" style={{ animation: 'spin 1s linear infinite' }} />}
        </div>
        <button 
          onClick={() => setIsFilterModalOpen(true)}
          style={{ height: '48px', padding: '0 16px', borderRadius: '12px', background: 'var(--color-bg-element)', border: '1px solid var(--color-border)', color: '#FAFAFA', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <SlidersHorizontal size={20} />
          <span style={{ fontWeight: 'bold' }}>Filtros</span>
          {(selectedGenres.length > 0 || selectedProviders.length > 0) && (
            <span style={{ background: 'var(--color-primary)', color: '#fff', fontSize: '12px', padding: '2px 6px', borderRadius: '8px', marginLeft: '4px' }}>
              {selectedGenres.length + selectedProviders.length}
            </span>
          )}
        </button>
      </div>

      {!isFiltering && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
          <button onClick={() => setActiveTab('trending')} style={{ fontSize: '16px', fontWeight: 'bold', color: activeTab === 'trending' ? 'var(--color-primary)' : 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Em Alta 🔥
          </button>
          <button onClick={() => setActiveTab('upcoming')} style={{ fontSize: '16px', fontWeight: 'bold', color: activeTab === 'upcoming' ? 'var(--color-primary)' : 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Em Breve 📅
          </button>
          <button onClick={() => setActiveTab('cinemas')} style={{ fontSize: '16px', fontWeight: 'bold', color: activeTab === 'cinemas' ? 'var(--color-primary)' : 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Cinemas Próximos 📍
          </button>
        </div>
      )}

      {activeTab === 'cinemas' ? (
        <CinemasMap />
      ) : loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <Loader2 size={40} color="#E50914" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : movies.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
           <p style={{ color: 'var(--color-text-muted)', fontSize: '18px' }}>Nenhum filme encontrado.</p>
        </div>
      ) : (
        <>
          <div className="responsive-grid" style={{ paddingBottom: '40px' }}>
            {movies.map((movie, index) => {
              let status: 'watched' | 'watchlist' | undefined = undefined;
              if (userStats.watched.includes(movie.id)) status = 'watched';
              else if (userStats.watchlist.includes(movie.id)) status = 'watchlist';

              // Usa id + index para evitar key duplication em infinite scroll no TMDB
              return <MovieCard key={`${movie.id}-${index}`} movie={movie} status={status} />;
            })}
          </div>
          
          <div ref={loadMoreRef} style={{ display: 'flex', justifyContent: 'center', padding: '24px 0 64px' }}>
            {loadingMore && <Loader2 size={32} color="#E50914" style={{ animation: 'spin 1s linear infinite' }} />}
            {!hasMore && movies.length > 0 && <p style={{ color: 'var(--color-text-muted)' }}>Você chegou ao fim da lista!</p>}
          </div>
        </>
      )}

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '400px', maxWidth: '100%', background: 'var(--color-bg-base)', height: '100%', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--color-border)', animation: 'slideIn 0.3s ease-out' }}>
            
            <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Filtros</h2>
              <button onClick={() => setIsFilterModalOpen(false)} style={{ background: 'none', border: 'none', color: '#FAFAFA', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>Gêneros</h3>
                {selectedGenres.length > 0 && (
                  <button onClick={() => setSelectedGenres([])} style={{ fontSize: '12px', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Limpar</button>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
                {genres.map(g => (
                  <button
                    key={g.id}
                    onClick={() => toggleGenre(g.id)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '16px',
                      background: selectedGenres.includes(g.id) ? 'rgba(229, 9, 20, 0.1)' : 'var(--color-bg-element)',
                      border: '1px solid ' + (selectedGenres.includes(g.id) ? '#E50914' : 'var(--color-border)'),
                      color: selectedGenres.includes(g.id) ? '#E50914' : '#FAFAFA',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    {g.name}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>Onde Assistir</h3>
                {selectedProviders.length > 0 && (
                  <button onClick={() => setSelectedProviders([])} style={{ fontSize: '12px', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Limpar</button>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {providers.map(p => (
                  <button
                    key={p.provider_id}
                    onClick={() => toggleProvider(p.provider_id)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '16px',
                      background: selectedProviders.includes(p.provider_id) ? 'rgba(229, 9, 20, 0.1)' : 'var(--color-bg-element)',
                      border: '1px solid ' + (selectedProviders.includes(p.provider_id) ? '#E50914' : 'var(--color-border)'),
                      color: selectedProviders.includes(p.provider_id) ? '#E50914' : '#FAFAFA',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    {p.provider_name}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: '24px', borderTop: '1px solid var(--color-border)' }}>
              <button 
                onClick={() => setIsFilterModalOpen(false)}
                style={{ width: '100%', background: 'var(--color-primary)', color: '#fff', height: '48px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
              >
                Ver Resultados
              </button>
            </div>
            
            <style>{`
              @keyframes slideIn {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
              }
              @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
}
