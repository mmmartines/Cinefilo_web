import { useState, useEffect } from 'react';
import { PageHeader } from '../../../components/PageHeader';
import { Film, CheckCircle, Clock, List, Plus, Share2, ArrowLeft, Edit2, Trash2, Check, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../../services/supabase';
import { database } from '../../../services/database';
import { MovieCard } from '../../../components/MovieCard';

type FilterType = 'watched' | 'watchlist' | 'lists';

export function MyMoviesHome() {
  const [filter, setFilter] = useState<FilterType>('watched');
  const [movies, setMovies] = useState<any[]>([]);
  
  const [customLists, setCustomLists] = useState<any[]>([]);
  const [activeList, setActiveList] = useState<any | null>(null);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editListName, setEditListName] = useState('');
  
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      
      if (filter === 'watched' || filter === 'watchlist') {
        const allWatched = await database.getWatchedMovies(session.user.id);
        if (filter === 'watched') setMovies(allWatched.filter((m: any) => m.status === 'watched'));
        else setMovies(allWatched.filter((m: any) => m.status === 'watchlist'));
      } else if (filter === 'lists') {
        const lists = await database.getCustomLists(session.user.id);
        setCustomLists(lists || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      await database.createCustomList(session.user.id, newListName);
      setNewListName('');
      setIsCreatingList(false);
      loadData(); // reload lists
    } catch (err) {
      console.error("Erro ao criar lista", err);
    }
  };

  const handleDeleteList = (e: React.MouseEvent, listId: string) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Lista',
      message: 'Tem certeza que deseja apagar esta lista? Esta ação não pode ser desfeita.',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          
          await database.deleteCustomList(session.user.id, listId);
          loadData();
        } catch (err) {
          console.error("Erro ao deletar lista", err);
        }
      }
    });
  };

  const handleRenameList = async (e: React.MouseEvent, listId: string) => {
    e.stopPropagation();
    if (!editListName.trim()) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      await database.renameCustomList(session.user.id, listId, editListName);
      setEditingListId(null);
      loadData();
    } catch (err) {
      console.error("Erro ao renomear lista", err);
    }
  };

  const handleRemoveMovieFromList = (e: React.MouseEvent, listId: string, movieId: number) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: 'Remover Filme',
      message: 'Remover este filme da lista?',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          
          await database.removeMovieFromCustomList(session.user.id, listId, movieId);
          
          setActiveList((prev: any) => {
            if (!prev) return prev;
            return { ...prev, movies: prev.movies.filter((m: any) => m.movieId !== movieId && m.id !== movieId) };
          });
          loadData();
        } catch (err) {
          console.error("Erro ao remover filme da lista", err);
        }
      }
    });
  };

  const startEditing = (e: React.MouseEvent, list: any) => {
    e.stopPropagation();
    setEditingListId(list.id || list._id);
    setEditListName(list.name);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingListId(null);
  };

  // Se tem uma lista ativa, mostra o conteúdo dela (sem as tabs normais)
  if (activeList) {
    return (
      <>
        <div className="animate-fade-in" style={{ padding: '0 16px', width: '100%' }}>
          <PageHeader 
            title={activeList.name} 
            subtitle={`${(activeList.movies || []).length} filmes`}
            showBackButton={true}
            onBack={() => setActiveList(null)}
          />

        {!(activeList.movies?.length > 0) ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--color-text-muted)' }}>
            <List size={64} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
            <h2 style={{ fontSize: '24px' }}>Esta lista está vazia.</h2>
          </div>
        ) : (
          <div className="responsive-grid">
            {activeList.movies.map((movie: any, idx: number) => (
              <MovieCard 
                key={movie.id || movie.movieId || idx} 
                movie={{
                  ...movie,
                  id: movie.id || movie.movieId,
                  vote_average: movie.vote_average || movie.rating || 0
                }}
                onRemove={(e) => handleRemoveMovieFromList(e, activeList.id || activeList._id, movie.id || movie.movieId)}
                hideRating={true}
              />
            ))}
          </div>
        )}
        </div>

        {/* Confirm Dialog Modal */}
        {confirmDialog.isOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ width: '400px', maxWidth: '90%', background: 'var(--color-bg-element)', borderRadius: '16px', padding: '24px', border: '1px solid var(--color-border)', animation: 'fade-in 0.2s ease-out' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>{confirmDialog.title}</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '16px', marginBottom: '24px' }}>
                {confirmDialog.message}
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                  style={{ padding: '12px 24px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDialog.onConfirm}
                  style={{ padding: '12px 24px', borderRadius: '12px', background: 'var(--color-primary)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="animate-fade-in" style={{ padding: '0 16px', width: '100%' }}>
        <PageHeader 
          title="Meus Filmes 🎬" 
          subtitle="Seu histórico, desejos e listas personalizadas."
        />

        {/* Botões de Filtro */}
      <div style={{ display: 'flex', gap: '32px', marginBottom: '32px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
        <button 
          onClick={() => setFilter('watched')}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', background: 'none', border: 'none',
            color: filter === 'watched' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            transition: 'color 0.2s'
          }}
        >
          <CheckCircle size={20} /> Assistidos
        </button>
        <button 
          onClick={() => setFilter('watchlist')}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', background: 'none', border: 'none',
            color: filter === 'watchlist' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            transition: 'color 0.2s'
          }}
        >
          <Clock size={20} /> Quero Assistir
        </button>
        <button 
          onClick={() => setFilter('lists')}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', background: 'none', border: 'none',
            color: filter === 'lists' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            transition: 'color 0.2s'
          }}
        >
          <List size={20} /> Minhas Listas
        </button>
      </div>

      {filter === 'lists' && (
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={() => setIsCreatingList(!isCreatingList)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'var(--color-primary)', color: 'white', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}
          >
            <Plus size={20} /> Nova Lista
          </button>
        </div>
      )}

      {filter === 'lists' && isCreatingList && (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', marginBottom: '32px', display: 'flex', gap: '16px', background: 'var(--color-bg-element)', border: '1px solid var(--color-border)' }}>
          <input 
            type="text" 
            placeholder="Nome da nova lista..." 
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', borderRadius: '12px', color: 'white' }}
          />
          <button onClick={handleCreateList} style={{ padding: '0 24px', background: 'white', color: 'black', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>
            Criar
          </button>
        </div>
      )}

      {/* Grid de Filmes ou Listas */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--color-text-muted)' }}>
          <div className="spinner" style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--color-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }} />
          <h2 style={{ fontSize: '20px' }}>Carregando...</h2>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : filter === 'lists' ? (
        customLists.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--color-text-muted)' }}>
            <List size={64} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
            <h2 style={{ fontSize: '24px' }}>Você ainda não criou nenhuma lista.</h2>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {customLists.map(list => (
              <div 
                key={list.id || list._id} 
                onClick={() => setActiveList(list)}
                className="hover-scale" 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', borderRadius: '16px', cursor: 'pointer', transition: 'transform 0.2s', background: 'var(--color-bg-element)', border: '1px solid var(--color-border)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <List size={24} color="white" />
                  </div>
                  <div>
                    {editingListId === (list.id || list._id) ? (
                      <input 
                        type="text" 
                        value={editListName}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setEditListName(e.target.value)}
                        autoFocus
                        style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-primary)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '18px', fontWeight: 'bold', outline: 'none' }}
                      />
                    ) : (
                      <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>{list.name}</h3>
                    )}
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                      De Você • {(list.movies || []).length} filmes
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {editingListId === (list.id || list._id) ? (
                    <>
                      <button 
                        onClick={(e) => handleRenameList(e, list.id || list._id)}
                        style={{ padding: '12px', background: 'var(--color-primary)', borderRadius: '12px', cursor: 'pointer', border: 'none' }}
                      >
                        <Check size={20} color="white" />
                      </button>
                      <button 
                        onClick={cancelEditing}
                        style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', cursor: 'pointer', border: 'none' }}
                      >
                        <X size={20} color="white" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={(e) => startEditing(e, list)}
                        style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', cursor: 'pointer', border: 'none' }}
                      >
                        <Edit2 size={20} color="white" />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteList(e, list.id || list._id)}
                        style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', cursor: 'pointer', border: 'none' }}
                      >
                        <Trash2 size={20} color="white" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); alert('Compartilhamento em breve'); }}
                        style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', cursor: 'pointer', border: 'none' }}
                      >
                        <Share2 size={20} color="white" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : movies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--color-text-muted)' }}>
          <Film size={64} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
          <h2 style={{ fontSize: '24px' }}>
            {filter === 'watched' ? 'Você ainda não avaliou nenhum filme.' : 'Sua lista de Quero Assistir está vazia.'}
          </h2>
        </div>
      ) : (
        <div className="responsive-grid">
          {movies.map((movie, idx) => (
            <MovieCard 
              key={movie.id || movie.movieId || idx} 
              movie={{
                ...movie,
                id: movie.id || movie.movieId,
                vote_average: movie.vote_average || movie.rating || 0
              }} 
            />
          ))}
        </div>
      )}
      </div>

      {/* Confirm Dialog Modal */}
      {confirmDialog.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: '400px', maxWidth: '90%', background: 'var(--color-bg-element)', borderRadius: '16px', padding: '24px', border: '1px solid var(--color-border)', animation: 'fade-in 0.2s ease-out' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>{confirmDialog.title}</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '16px', marginBottom: '24px' }}>
              {confirmDialog.message}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                style={{ padding: '12px 24px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDialog.onConfirm}
                style={{ padding: '12px 24px', borderRadius: '12px', background: 'var(--color-primary)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
