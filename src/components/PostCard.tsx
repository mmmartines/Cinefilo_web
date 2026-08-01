import { Star, Trophy, Medal, Smile, Heart, ThumbsUp, Frown } from 'lucide-react';
import { useState } from 'react';

// Helpers
const getReactionIcon = (type: string) => {
  switch (type) {
    case 'like': return <ThumbsUp size={20} color="#3b5998" />;
    case 'love': return <Heart size={20} color="#E50914" />;
    case 'funny': return <Smile size={20} color="#F5C518" />;
    case 'sad': return <Frown size={20} color="#3498db" />;
    default: return <ThumbsUp size={20} color="var(--color-text-muted)" />;
  }
};

export function PostCard({ post, currentUser, onReact }: { post: any, currentUser?: any, onReact?: (activityId: string, type: string) => void }) {
  const [showSpoiler, setShowSpoiler] = useState(false);
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);

  let actionText = '';
  if (post.action === 'watched') actionText = 'assistiu ao filme';
  else if (post.action === 'rated') actionText = 'avaliou o filme';
  else if (post.action === 'added_to_list') actionText = 'adicionou a uma lista';
  else if (post.action === 'unlocked_badge') actionText = 'desbloqueou uma conquista!';
  else if (post.action === 'challenge_completed') actionText = 'completou o Desafio Semanal!';

  const isSpoilerHidden = post.has_spoiler && !showSpoiler;

  return (
    <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', marginBottom: '24px' }}>
      
      {/* Header do Post: Usuário */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <img 
          src={post.user_avatar || 'https://i.pravatar.cc/150'} 
          alt={post.user_name} 
          style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-full)', border: '2px solid var(--color-primary)' }}
        />
        <div>
          <h4 style={{ fontWeight: 'bold', fontSize: '16px' }}>
            {post.user_name}
          </h4>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{actionText} • {new Date(post.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Conteúdo Dinâmico */}
      {post.action === 'challenge_completed' ? (
        <div style={{ display: 'flex', gap: '16px', background: 'rgba(229, 9, 20, 0.1)', border: '1px solid #E50914', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
           <div style={{ width: '64px', height: '64px', background: 'rgba(229, 9, 20, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Trophy size={32} color="#E50914" />
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
             <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#E50914' }}>{post.challenge_title || 'Desafio Semanal'}</h3>
             <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>+{post.challenge_xp || 50} XP conquistados!</span>
           </div>
        </div>
      ) : post.action === 'unlocked_badge' && post.badge ? (
        <div style={{ display: 'flex', gap: '16px', background: `rgba(255, 215, 0, 0.1)`, border: `1px solid ${post.badge.color || 'var(--color-border)'}`, padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
           <div style={{ width: '64px', height: '64px', background: post.badge.color ? `${post.badge.color}22` : 'var(--color-bg-element)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Medal size={32} color={post.badge.color || 'white'} />
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
             <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: post.badge.color || 'white' }}>{post.badge.name}</h3>
             <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{post.badge.description}</span>
           </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '16px', background: 'var(--color-bg-element)', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
          {post.movie_poster && (
            <img 
              src={`https://image.tmdb.org/t/p/w200${post.movie_poster}`} 
              alt={post.movie_title} 
              style={{ width: '80px', borderRadius: '8px', objectFit: 'cover' }}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{post.movie_title}</h3>
            {post.rating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
                <Star size={16} color="#FFD700" fill="#FFD700" />
                <span style={{ fontWeight: 'bold' }}>{post.rating}/5</span>
              </div>
            )}
            
            {post.review && (
              <div style={{ marginTop: '12px', position: 'relative' }}>
                <p style={{ fontSize: '15px', lineHeight: 1.5, color: 'var(--color-text)', fontStyle: 'italic', filter: isSpoilerHidden ? 'blur(5px)' : 'none' }}>
                  "{post.review}"
                </p>
                {isSpoilerHidden && (
                  <button 
                    onClick={() => setShowSpoiler(true)}
                    style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.8)', padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: '1px solid var(--color-border)', color: 'white', cursor: 'pointer' }}
                  >
                    Contém Spoiler (Ver)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ações / Reações */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '16px', position: 'relative' }}>
        
        <div 
          style={{ position: 'relative' }}
          onMouseEnter={() => setShowReactionsMenu(true)}
          onMouseLeave={() => setShowReactionsMenu(false)}
        >
          <button 
            onClick={() => {
              if (onReact) {
                const existing = post.reactions?.find((r: any) => r.user_id === currentUser?.id);
                onReact(post.id || post._id, existing ? existing.type : 'like');
              }
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', cursor: 'pointer', background: 'transparent', padding: '8px', border: 'none' }}
          >
            {(() => {
               const myReaction = currentUser && post.reactions?.find((r: any) => r.user_id === currentUser.id);
               return myReaction ? getReactionIcon(myReaction.type) : <ThumbsUp size={20} />;
            })()}
            <span style={{ fontWeight: 'bold' }}>Reagir</span>
          </button>

          {showReactionsMenu && (
            <div 
              style={{ position: 'absolute', bottom: '100%', left: 0, background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', borderRadius: '30px', padding: '8px 16px', display: 'flex', gap: '16px', boxShadow: '0 8px 16px rgba(0,0,0,0.5)', zIndex: 10, paddingBottom: '16px', marginBottom: '-8px' }}
            >
              <button onClick={() => { onReact && onReact(post.id || post._id, 'like'); setShowReactionsMenu(false); }} style={{ cursor: 'pointer', transition: 'transform 0.2s', background: 'transparent', border: 'none' }}><ThumbsUp size={24} color="#3b5998" /></button>
              <button onClick={() => { onReact && onReact(post.id || post._id, 'love'); setShowReactionsMenu(false); }} style={{ cursor: 'pointer', transition: 'transform 0.2s', background: 'transparent', border: 'none' }}><Heart size={24} color="#E50914" /></button>
              <button onClick={() => { onReact && onReact(post.id || post._id, 'funny'); setShowReactionsMenu(false); }} style={{ cursor: 'pointer', transition: 'transform 0.2s', background: 'transparent', border: 'none' }}><Smile size={24} color="#F5C518" /></button>
              <button onClick={() => { onReact && onReact(post.id || post._id, 'sad'); setShowReactionsMenu(false); }} style={{ cursor: 'pointer', transition: 'transform 0.2s', background: 'transparent', border: 'none' }}><Frown size={24} color="#3498db" /></button>
            </div>
          )}
        </div>

        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', background: 'transparent', border: 'none' }}>
          <span style={{ fontWeight: 'bold' }}>{(post.reactions || []).length} Reações</span>
        </button>
      </div>

    </div>
  );
}
