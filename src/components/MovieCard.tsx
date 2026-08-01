import { Star, CheckCircle, Bookmark, Film, Clock, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MovieCardProps {
  movie: any;
  status?: 'watched' | 'watchlist';
  onRemove?: (e: React.MouseEvent) => void;
  hideRating?: boolean;
}

export function MovieCard({ movie, status, onRemove, hideRating }: MovieCardProps) {
  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : 'https://placehold.co/500x750/1a1a1a/ffffff?text=Sem+Poster';

  let isNowPlaying = false;
  let isUpcoming = false;
  
  if (movie.release_date) {
    const release = new Date(movie.release_date);
    const now = new Date();
    const diffTime = now.getTime() - release.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    if (diffDays < 0) {
      isUpcoming = true;
    } else if (diffDays >= 0 && diffDays <= 45) {
      isNowPlaying = true;
    }
  }

  return (
    <Link to={`/movie/${movie.id}`} className="movie-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', textDecoration: 'none', color: 'inherit' }}>
      <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '2/3', backgroundColor: 'var(--color-bg-element)' }}>
        <img 
          src={imageUrl} 
          alt={movie.title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {status && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.65)' }} />
        )}
        
        {!hideRating && movie.vote_average !== undefined && movie.vote_average !== null && (
          <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', padding: '4px 8px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Star size={12} color="#FFD700" fill="#FFD700" />
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{Number(movie.vote_average).toFixed(1)}</span>
          </div>
        )}

        {isNowPlaying && (
          <div style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: 'rgba(229, 9, 20, 0.95)', padding: '4px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Film size={12} color="#fff" />
            <span style={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}>Em Cartaz</span>
          </div>
        )}

        {isUpcoming && (
          <div style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: 'rgba(52, 152, 219, 0.95)', padding: '4px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} color="#fff" />
            <span style={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}>Em Breve</span>
          </div>
        )}

        {onRemove && (
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(e); }}
            style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(229, 9, 20, 0.9)', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', zIndex: 10 }}
          >
            <X size={14} color="#fff" />
          </button>
        )}

        {status === 'watched' && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0, 168, 89, 0.95)', padding: '4px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <CheckCircle size={12} color="#fff" />
            <span style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>Assistido</span>
          </div>
        )}

        {status === 'watchlist' && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(229, 9, 20, 0.95)', padding: '4px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <Bookmark size={12} color="#fff" />
            <span style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>Quero Ver</span>
          </div>
        )}
      </div>
    </Link>
  );
}
