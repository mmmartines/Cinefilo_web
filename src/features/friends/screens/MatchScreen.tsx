import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { fetchFilteredMovies } from '../../../services/api';
import { database } from '../../../services/database';
import { ArrowLeft, X, Heart, Film } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';

export function MatchScreen() {
  const { friendId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // You might want to pass friendName via state in router if possible, or fetch it
  const friendName = new URLSearchParams(location.search).get('name') || 'Amigo';

  const [movies, setMovies] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Animations
  const [cardClass, setCardClass] = useState('');

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    try {
      setLoading(true);
      const results = await fetchFilteredMovies(1, '', [], '', []);
      setMovies((results || []).slice(0, 20));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'liked' | 'passed') => {
    if (currentIndex >= movies.length) return;
    
    const currentMovie = movies[currentIndex];
    
    setCardClass(action === 'liked' ? 'slide-right' : 'slide-left');
    
    setTimeout(async () => {
      setCurrentIndex(prev => prev + 1);
      setCardClass('');
      
      if (friendId) {
        try {
          const result = await database.saveMovieMatch(friendId, currentMovie.id, action);
          if (result && result.isMatch) {
            alert(`🔥 Deu Match! 🔥\nVoce e ${friendName} querem assistir "${currentMovie.title}"!`);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }, 300);
  };

  if (loading) {
    return (
      <div style={{ flex: 1, minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner" style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid #E50914', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const currentMovie = movies[currentIndex];

  return (
    <div style={{ flex: 1, minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', color: '#FAFAFA' }}>
      
      <div style={{ padding: '0 16px' }}>
        <PageHeader 
          title={`Match com ${friendName} ❤️`} 
          subtitle="Descubra se vocês dão match!"
          showBackButton={true}
        />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '24px', overflow: 'hidden' }}>
        {currentIndex < movies.length && currentMovie ? (
          <>
            <div className={cardClass} style={{ width: '85%', maxWidth: '400px', height: '65vh', background: 'var(--color-bg-element)', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--color-border)', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', transition: 'transform 0.3s ease-out, opacity 0.3s ease-out' }}>
              <img
                src={`https://image.tmdb.org/t/p/w500` + currentMovie.poster_path}
                alt={currentMovie.title}
                style={{ width: '100%', height: '70%', objectFit: 'cover' }}
              />
              <div style={{ padding: '16px', height: '30%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentMovie.title}</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{currentMovie.overview}</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '32px' }}>
              <button 
                onClick={() => handleAction('passed')}
                style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--color-bg-element)', border: '2px solid #F44336', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', boxShadow: '0 3px 10px rgba(0,0,0,0.2)' }}
              >
                <X size={40} color="#F44336" />
              </button>
              <button 
                onClick={() => handleAction('liked')}
                style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--color-bg-element)', border: '2px solid #4CAF50', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', boxShadow: '0 3px 10px rgba(0,0,0,0.2)' }}
              >
                <Heart size={40} color="#4CAF50" />
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Film size={64} color="#666" />
            <p style={{ fontSize: '18px', marginTop: '16px', marginBottom: '24px' }}>Sem mais filmes no momento!</p>
            <button 
              onClick={loadMovies}
              style={{ background: '#E50914', padding: '12px 24px', borderRadius: '8px', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
            >
              Buscar Mais
            </button>
          </div>
        )}
      </div>

      <style>
        {`
          .slide-right { transform: translateX(100%) rotate(10deg); opacity: 0; }
          .slide-left { transform: translateX(-100%) rotate(-10deg); opacity: 0; }
        `}
      </style>

    </div>
  );
}
