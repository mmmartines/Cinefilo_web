import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame, Film, Clock, AtSign, Trophy } from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { database } from '../../../services/database';
import { MovieCard } from '../../../components/MovieCard';

export function FriendProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [friend, setFriend] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [affinity, setAffinity] = useState(0);
  const [activeTab, setActiveTab] = useState<'resumo' | 'filmes'>('resumo');

  useEffect(() => {
    loadFriend();
  }, [id]);

  const loadFriend = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`https://cinefilo-server.vercel.app/api/friends?id=${id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        const result = await response.json();
        const fData = result.data;
        setFriend(fData);

        // Calc affinity
        const myWatched = await database.getWatchedMovies(session.user.id);
        const myWatchedIds = new Set(myWatched.map((m: any) => m.movieId || m.id));
        const friendWatched = fData.watched_movies || [];

        if (myWatchedIds.size > 0 && friendWatched.length > 0) {
          const commonCount = friendWatched.filter((m: any) => myWatchedIds.has(m.movieId || m.id)).length;
          const minSize = Math.min(myWatchedIds.size, friendWatched.length);
          const baseAffinity = Math.round((commonCount / minSize) * 100);
          const volumeBoost = Math.min(15, commonCount);
          setAffinity(Math.min(100, baseAffinity + volumeBoost));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatRuntime = (minutes: number) => {
    if (!minutes) return '0h';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  };

  if (loading) {
    return (
      <div style={{ flex: 1, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner" style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--color-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!friend) {
    return (
      <div style={{ padding: '64px', textAlign: 'center' }}>
        <h2 style={{ color: 'white', marginBottom: '16px' }}>Perfil não encontrado ou acesso negado.</h2>
        <button onClick={() => navigate(-1)} style={{ background: 'var(--color-primary)', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Voltar</button>
      </div>
    );
  }

  const completedChallengesCount = (friend.completed_challenges || []).length;
  const level = friend.stats?.level || Math.floor((friend.stats?.xp || 0) / 100) + 1 || 1;

  return (
    <div className="animate-fade-in" style={{ padding: '0 16px', width: '100%', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'var(--color-bg-element)', border: '1px solid var(--color-border)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', cursor: 'pointer' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{friend.name}</h1>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
        <button 
          onClick={() => setActiveTab('resumo')}
          style={{ 
            fontSize: '16px', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer',
            color: activeTab === 'resumo' ? 'var(--color-primary)' : 'var(--color-text-muted)' 
          }}
        >
          Resumo
        </button>
        <button 
          onClick={() => setActiveTab('filmes')}
          style={{ 
            fontSize: '16px', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer',
            color: activeTab === 'filmes' ? 'var(--color-primary)' : 'var(--color-text-muted)' 
          }}
        >
          Filmes Assistidos
        </button>
      </div>

      {activeTab === 'resumo' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
            <img 
              src={friend.avatar_url || 'https://i.pravatar.cc/150'} 
              alt="Avatar" 
              style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid var(--color-primary)', objectFit: 'cover', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '24px', border: '1px solid var(--color-border)' }}>
              <AtSign size={16} color="var(--color-text-muted)" />
              <span style={{ color: 'white', fontWeight: 'bold' }}>{friend.nickname || friend.tag}</span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Flame size={24} color={affinity > 50 ? "#FF5722" : "#666"} />
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>Afinidade Cinematográfica</h3>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--color-bg-element)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ width: `${affinity}%`, height: '100%', background: affinity > 50 ? '#FF5722' : 'var(--color-text-muted)', borderRadius: '4px' }} />
            </div>
            <span style={{ color: 'var(--color-text-muted)', fontWeight: 'bold' }}>{affinity}% de compatibilidade</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Film size={32} color="var(--color-primary)" />
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{friend.stats?.total_movies || 0}</span>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Filmes Assistidos</span>
            </div>
            
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Clock size={32} color="var(--color-primary)" />
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{formatRuntime(friend.stats?.total_minutes || 0)}</span>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Tempo de Tela</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '40px', height: '40px', background: 'var(--color-primary)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
                {level}
              </div>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>Nível Real</span>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>XP Atual</span>
            </div>
            
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Trophy size={32} color="#FFD700" />
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{completedChallengesCount}</span>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Conquistas</span>
            </div>
          </div>

          <button 
            onClick={() => navigate(`/match/${friend.id}?name=${encodeURIComponent(friend.name)}`)}
            style={{ width: '100%', padding: '16px', background: 'var(--color-primary)', borderRadius: '16px', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', cursor: 'pointer', marginTop: '16px', boxShadow: '0 4px 15px rgba(229, 9, 20, 0.4)' }}
          >
            <Flame size={24} color="white" />
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>Match de Filmes</span>
          </button>

        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
          {!friend.watched_movies || friend.watched_movies.length === 0 ? (
             <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
               Este amigo ainda não assistiu nenhum filme.
             </div>
          ) : (
             friend.watched_movies.map((m: any, idx: number) => {
               const movieFormatted = {
                 id: m.movieId || m.id,
                 title: m.title,
                 poster_path: m.poster_path,
                 backdrop_path: m.backdrop_path,
               };
               return (
                 <div key={`${movieFormatted.id}-${idx}`} style={{ pointerEvents: 'none' }}>
                   <MovieCard movie={movieFormatted} status="watched" />
                 </div>
               );
             })
          )}
        </div>
      )}
    </div>
  );
}
