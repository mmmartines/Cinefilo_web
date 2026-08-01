import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMovieDetails } from '../../../services/api';
import { database } from '../../../services/database';
import { supabase } from '../../../services/supabase';
import { Star, Clock, Calendar, ArrowLeft, Play, Bookmark, BookmarkCheck, CheckCircle2, Circle, X } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';

const EMOTIONS = [
  { label: '🤩 Espetacular', type: 'good', color: '#4CAF50' },
  { label: '🤯 Explodiu a cabeça', type: 'good', color: '#9C27B0' },
  { label: '😂 Muito Engraçado', type: 'good', color: '#FFEB3B' },
  { label: '😍 Apaixonante', type: 'good', color: '#E91E63' },
  { label: '😭 Chorei muito', type: 'good', color: '#2196F3' },
  { label: '👏 Brilhante', type: 'good', color: '#00BCD4' },
  { label: '✨ Lindo visual', type: 'good', color: '#009688' },
  { label: '🤔 Inteligente', type: 'good', color: '#5C6BC0' },
  { label: '🥰 Inspirador', type: 'good', color: '#8BC34A' },
  { label: '😌 Relaxante', type: 'good', color: '#8BC34A' },
  { label: '🤷 Confuso', type: 'neutral', color: '#B0BEC5' },
  { label: '😐 Mediano', type: 'neutral', color: '#A1887F' },
  { label: '🥱 Entediante', type: 'neutral', color: '#90A4AE' },
  { label: '😬 Tenso', type: 'bad', color: '#FF9800' },
  { label: '😨 Assustador', type: 'bad', color: '#7E57C2' },
  { label: '😞 Decepcionante', type: 'bad', color: '#EF5350' },
  { label: '😡 Revoltante', type: 'bad', color: '#E53935' },
  { label: '🤦 Previsível', type: 'bad', color: '#A1887F' },
  { label: '🤮 Péssimo', type: 'bad', color: '#E50914' },
];

export function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [sessionUser, setSessionUser] = useState<any>(null);

  // Modal states
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [movieRating, setMovieRating] = useState(0);
  const [movieReview, setMovieReview] = useState('');
  const [hasMovieSpoiler, setHasMovieSpoiler] = useState(false);
  const [selectedMovieEmotions, setSelectedMovieEmotions] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function fetchDetails() {
      if (!id) return;
      try {
        const data = await getMovieDetails(id);
        setMovie(data);
        
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSessionUser(session.user);
          const watchedList = await database.getWatchedMovies(session.user.id);
          if (watchedList) {
            
            const isMovieInWatched = watchedList.find((m: any) => String(m.movieId || m.id) === String(id) && m.status === 'watched');
            if (isMovieInWatched) {
              setIsWatched(true);
              setMovieRating(isMovieInWatched.rating || 0);
              setMovieReview(isMovieInWatched.review || '');
              setSelectedMovieEmotions(isMovieInWatched.emotions || []);
            }
            
            const isMovieInWatchlist = watchedList.find((m: any) => String(m.movieId || m.id) === String(id) && m.status === 'watchlist');
            if (isMovieInWatchlist) setIsWatchlisted(true);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar detalhes do filme", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [id]);

  const handleToggleWatchlist = async () => {
    if (!movie || !sessionUser) return;
    try {
      if (isWatchlisted) {
        await database.removeWatchedMovie(sessionUser.id, movie.id);
        setIsWatchlisted(false);
      } else {
        await database.saveWatchedMovie(sessionUser.id, movie, 0, '', movie.runtime, [], 'watchlist', false);
        setIsWatchlisted(true);
        setIsWatched(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveMovieRating = async () => {
    if (movieRating === 0) {
      setErrorMsg('Por favor, dê uma nota de 1 a 5 estrelas.');
      return;
    }
    if (selectedMovieEmotions.length < 3) {
      setErrorMsg('Por favor, selecione pelo menos 3 emoções que o filme lhe causou.');
      return;
    }

    try {
      await database.saveWatchedMovie(sessionUser.id, movie, movieRating, movieReview, movie.runtime, selectedMovieEmotions, 'watched', hasMovieSpoiler);
      setIsWatched(true);
      setIsWatchlisted(false);
      setIsRatingModalVisible(false);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg('Ocorreu um erro ao salvar o filme.');
    }
  };

  const handleRemoveMovieData = async () => {
    try {
      await database.removeWatchedMovie(sessionUser.id, movie.id);
      setIsWatched(false);
      setIsWatchlisted(false);
      setMovieRating(0);
      setMovieReview('');
      setHasMovieSpoiler(false);
      setSelectedMovieEmotions([]);
      setIsRatingModalVisible(false);
    } catch (err) {
      setErrorMsg('Erro ao remover filme.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '18px' }}>Carregando obra-prima...</p>
      </div>
    );
  }

  if (!movie) {
    return <div style={{ padding: '32px' }}>Filme não encontrado.</div>;
  }

  const backdropUrl = movie.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : '';

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : 'https://placehold.co/500x750/1a1a1a/ffffff?text=Sem+Poster';

  const trailer = movie.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
  
  const providers = movie['watch/providers']?.results?.BR?.flatrate || [];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '64px' }}>
      
      <div style={{ padding: '0 16px', width: '100%' }}>
        <PageHeader 
          title="" 
          showBackButton={true} 
        />
      </div>

      {/* Hero Section */}
      <div style={{ 
        position: 'relative', 
        borderRadius: 'var(--radius-lg)', 
        overflow: 'hidden', 
        minHeight: '400px',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '48px',
        background: `linear-gradient(to top, var(--color-bg-base) 0%, rgba(15,15,17,0.3) 100%), url(${backdropUrl}) center/cover no-repeat`
      }}>
        
        <div className="responsive-row" style={{ display: 'flex', gap: '32px', alignItems: 'center', zIndex: 2 }}>
          <img 
            src={posterUrl} 
            alt={movie.title} 
            style={{ width: '200px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)' }}
          />
          <div style={{ paddingBottom: '16px' }}>
            <h1 style={{ fontSize: '48px', fontWeight: '800', lineHeight: 1.1, marginBottom: '16px' }}>
              {movie.title}
            </h1>
            
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Star color="#E50914" fill="#E50914" size={24} />
                <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{movie.vote_average.toFixed(1)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)' }}>
                <Clock size={20} />
                <span>{movie.runtime} min</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)' }}>
                <Calendar size={20} />
                <span>{new Date(movie.release_date).getFullYear()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
              {movie.genres?.map((g: any) => (
                <span key={g.id} style={{ padding: '6px 12px', background: 'var(--color-bg-element)', borderRadius: 'var(--radius-full)', fontSize: '14px', border: '1px solid var(--color-border)' }}>
                  {g.name}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button 
                onClick={handleToggleWatchlist}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 16px', borderRadius: '8px',
                  background: isWatchlisted ? 'rgba(255, 255, 255, 0.1)' : 'var(--color-primary)',
                  border: isWatchlisted ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
                  color: 'white', fontWeight: 'bold'
                }}
              >
                {isWatchlisted ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                {isWatchlisted ? 'Salvo' : 'Quero Ver'}
              </button>

              <button 
                onClick={() => setIsRatingModalVisible(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 16px', borderRadius: '8px',
                  background: isWatched ? 'rgba(76, 175, 80, 0.2)' : 'var(--color-primary)',
                  border: isWatched ? '1px solid #4CAF50' : 'none',
                  color: isWatched ? '#4CAF50' : 'white', fontWeight: 'bold', cursor: 'pointer'
                }}
              >
                {isWatched ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                {isWatched ? 'Já Assisti' : 'Já Assisti'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Abaixo */}
      <div className="responsive-row" style={{ display: 'flex', gap: '48px', marginTop: '48px' }}>
        {/* Esquerda: Sinopse e Elenco */}
        <div style={{ flex: 2 }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Sinopse</h2>
          <p style={{ fontSize: '18px', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '48px' }}>
            {movie.overview || 'Sinopse não disponível em português.'}
          </p>

          {isWatched && (
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', marginBottom: '48px', borderLeft: '4px solid var(--color-primary)', backgroundColor: 'var(--color-bg-element)' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: 'white' }}>Sua Avaliação</h3>
              
              <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={20} color={star <= movieRating ? "#FFD700" : "#666"} fill={star <= movieRating ? "#FFD700" : "transparent"} />
                ))}
              </div>

              {selectedMovieEmotions.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: movieReview ? '16px' : '0' }}>
                  {selectedMovieEmotions.map((emotionLabel, index) => {
                    const em = EMOTIONS.find(e => e.label === emotionLabel);
                    const match = emotionLabel.match(/^(\S+)\s+(.+)$/);
                    const emoji = match ? match[1] : emotionLabel.charAt(0);
                    const text = match ? match[2] : emotionLabel.slice(1).trim();
                    
                    return (
                      <span key={index} style={{ 
                        padding: '6px 12px', 
                        borderRadius: '16px', 
                        fontSize: '12px', 
                        fontWeight: 'bold',
                        backgroundColor: em ? `${em.color}22` : 'var(--color-border)',
                        border: `1px solid ${em ? em.color : 'var(--color-text-muted)'}`,
                        color: em ? em.color : 'var(--color-text)'
                      }}>
                        <span style={{ fontWeight: 'normal', marginRight: '4px' }}>{emoji}</span>
                        {text}
                      </span>
                    );
                  })}
                </div>
              )}

              {movieReview && (
                <p style={{ fontStyle: 'italic', color: 'var(--color-text-muted)', fontSize: '16px', lineHeight: 1.5 }}>
                  "{movieReview}"
                </p>
              )}
            </div>
          )}

          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Elenco Principal</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
            {movie.credits?.cast?.slice(0, 6).map((actor: any) => (
              <div key={actor.id} className="glass-panel" style={{ padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                <img 
                  src={actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : 'https://placehold.co/150x150/1a1a1a/ffffff?text=Sem+Foto'} 
                  alt={actor.name}
                  style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-full)', objectFit: 'cover', marginBottom: '12px', border: '2px solid var(--color-border)' }}
                />
                <h3 style={{ fontSize: '14px', fontWeight: '600' }}>{actor.name}</h3>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{actor.character}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Direita: Onde Assistir e Trailer */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {providers.length > 0 && (
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Onde Assistir 🍿</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {providers.map((p: any) => (
                  <div key={p.provider_id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <img 
                      src={`https://image.tmdb.org/t/p/w92${p.logo_path}`} 
                      alt={p.provider_name}
                      style={{ width: '48px', height: '48px', borderRadius: '12px' }}
                    />
                    <span style={{ fontSize: '12px', textAlign: 'center' }}>{p.provider_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {trailer && (
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Play size={20} color="var(--color-primary)" />
                Trailer Oficial
              </h3>
              <a 
                href={`https://www.youtube.com/watch?v=${trailer.key}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  display: 'block',
                  background: 'var(--color-primary)', 
                  color: 'white', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}
              >
                Assistir no YouTube
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Modal Já Assisti */}
      {isRatingModalVisible && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel animate-fade-in" style={{ backgroundColor: 'var(--color-bg-element)', width: '90%', maxWidth: '500px', borderRadius: '16px', padding: '32px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setIsRatingModalVisible(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: 'white' }}>Avalie o Filme</h2>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setMovieRating(star)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <Star size={40} color={star <= movieRating ? "#FFD700" : "#666"} fill={star <= movieRating ? "#FFD700" : "transparent"} />
                </button>
              ))}
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', alignSelf: 'flex-start', color: 'white' }}>O que sentiu? (Mínimo 3)</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px', width: '100%' }}>
              {EMOTIONS.map((emotion, index) => {
                const isSelected = selectedMovieEmotions.includes(emotion.label);
                const match = emotion.label.match(/^(\S+)\s+(.+)$/);
                const emoji = match ? match[1] : emotion.label.charAt(0);
                const text = match ? match[2] : emotion.label.slice(1).trim();
                
                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedMovieEmotions(prev => prev.filter(e => e !== emotion.label));
                      } else {
                        setSelectedMovieEmotions(prev => [...prev, emotion.label]);
                      }
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '24px', cursor: 'pointer', fontWeight: 'bold',
                      backgroundColor: isSelected ? `${emotion.color}22` : 'transparent',
                      border: `1px solid ${isSelected ? emotion.color : 'var(--color-border)'}`,
                      color: isSelected ? emotion.color : 'var(--color-text-muted)'
                    }}
                  >
                    <span>{emoji}</span>
                    <span style={{ fontSize: '14px' }}>{text}</span>
                  </button>
                );
              })}
            </div>

            <textarea
              placeholder="O que achou do filme? (Opcional)"
              value={movieReview}
              onChange={(e) => setMovieReview(e.target.value)}
              style={{ width: '100%', padding: '16px', borderRadius: '8px', backgroundColor: 'var(--color-border)', color: 'white', border: 'none', minHeight: '120px', resize: 'vertical', marginBottom: '24px', fontSize: '16px' }}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', marginBottom: '32px' }}>
              <span style={{ fontWeight: 'bold', color: 'white' }}>Contém Spoiler?</span>
              <button 
                onClick={() => setHasMovieSpoiler(!hasMovieSpoiler)}
                style={{ width: '28px', height: '28px', borderRadius: '4px', border: '2px solid var(--color-text-muted)', background: hasMovieSpoiler ? '#E50914' : 'transparent', borderColor: hasMovieSpoiler ? '#E50914' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                {hasMovieSpoiler && <CheckCircle2 size={16} color="white" />}
              </button>
            </div>

            {errorMsg && (
              <div style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(229, 9, 20, 0.1)', color: '#E50914', borderRadius: '8px', border: '1px solid #E50914', marginBottom: '24px', textAlign: 'center', fontWeight: 'bold' }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
              {isWatched ? (
                <button onClick={handleRemoveMovieData} style={{ flex: 1, padding: '16px', borderRadius: '8px', background: 'transparent', border: '1px solid #E50914', color: '#E50914', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>
                  Remover Avaliação
                </button>
              ) : (
                <button onClick={() => setIsRatingModalVisible(false)} style={{ flex: 1, padding: '16px', borderRadius: '8px', background: 'var(--color-border)', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>
                  Cancelar
                </button>
              )}
              <button onClick={handleSaveMovieRating} style={{ flex: 1, padding: '16px', borderRadius: '8px', background: '#E50914', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
