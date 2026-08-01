import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchFilteredMovies } from '../../../services/api';
import { ArrowLeft, Dices, Shuffle, Film, Filter, Loader2, Play } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';

export function RouletteScreen() {
  const navigate = useNavigate();
  const [movie, setMovie] = useState<any>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const spinRoulette = async () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setMovie(null);
    
    try {
      const randomPage = Math.floor(Math.random() * 20) + 1;
      const results = await fetchFilteredMovies(randomPage, '', [], '', []);
      
      if (results && results.length > 0) {
        const randomMovieIndex = Math.floor(Math.random() * results.length);
        const selectedMovie = results[randomMovieIndex];
        
        setTimeout(() => {
          setMovie(selectedMovie);
          setIsSpinning(false);
        }, 1500);
      }
    } catch (e) {
      console.error(e);
      setIsSpinning(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 16px', width: '100%', paddingBottom: '100px', display: 'flex', flexDirection: 'column' }}>
      
      <PageHeader 
        title="O que assistir hoje? 🎲" 
        subtitle="Gire a roleta e deixe o destino escolher."
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', paddingBottom: '100px' }}>
        {!movie ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            <div className={isSpinning ? "spin-animation" : ""} style={{ transition: 'all 0.3s' }}>
              <Dices size={120} color={isSpinning ? "#E50914" : "#666"} />
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '18px', textAlign: 'center' }}>
              {isSpinning ? "Sorteando um filme..." : "Deixe o acaso escolher seu proximo filme!"}
            </p>
          </div>
        ) : (
          <div className="fade-in" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--color-bg-element)', padding: '24px', borderRadius: '24px', border: '1px solid var(--color-border)' }}>
            <img 
              src={`https://image.tmdb.org/t/p/w500` + movie.poster_path} 
              alt={movie.title}
              style={{ width: '200px', height: '300px', borderRadius: '16px', marginBottom: '24px', objectFit: 'cover' }}
            />
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', marginBottom: '8px' }}>{movie.title}</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', textAlign: 'center', marginBottom: '24px', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{movie.overview}</p>
            
            <button 
              onClick={() => navigate(`/movie/` + movie.id)}
              style={{ background: 'var(--color-border)', padding: '12px 32px', borderRadius: '8px', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
            >
              Ver Detalhes
            </button>
          </div>
        )}
      </div>

      <style>
        {
          `@keyframes fastSpin { 100% { transform: rotate(360deg); } }
          .spin-animation { animation: fastSpin 0.5s linear infinite; }
          @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
          .fade-in { animation: fadeIn 0.5s ease-out forwards; }`
        }
      </style>

      <div style={{ padding: '24px', paddingBottom: '40px', display: 'flex', justifyContent: 'center' }}>
        <button 
          onClick={spinRoulette}
          disabled={isSpinning}
          style={{ maxWidth: '400px', width: '100%', background: '#E50914', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '18px', borderRadius: '16px', gap: '12px', border: 'none', color: '#fff', fontSize: '20px', fontWeight: 'bold', cursor: isSpinning ? 'not-allowed' : 'pointer', opacity: isSpinning ? 0.7 : 1 }}
        >
          <Shuffle size={24} />
          {movie ? "Sortear Novamente" : "Girar Roleta"}
        </button>
      </div>

    </div>
  );
}
