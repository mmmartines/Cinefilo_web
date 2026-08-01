import { useHeroStats } from '../hooks/useHeroStats';
import { PageHeader } from '../../../components/PageHeader';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, Star, Film, Clock, Medal, Heart, Book, 
  MessageCircle, Globe, Diamond, Coffee, Pizza, 
  Timer, Bed, Camera, CreditCard, Image as ImageIcon, 
  Footprints, Tv, Home, Calendar, Laptop, Hourglass, Sparkles
} from 'lucide-react';

// Mapper from Ionicons (used in badges.ts) to Lucide React
const IconMap: Record<string, any> = {
  'film': Film,
  'glasses': Book,
  'videocam': Film,
  'heart': Heart,
  'star': Star,
  'medal': Medal,
  'ribbon': Medal,
  'ticket': Film,
  'book': Book,
  'chatbubbles': MessageCircle,
  'trophy': Trophy,
  'planet': Globe,
  'diamond': Diamond,
  'time': Clock,
  'cafe': Coffee,
  'fast-food': Pizza,
  'timer': Timer,
  'bed': Bed,
  'camera': Camera,
  'card': CreditCard,
  'star-half': Star,
  'images': ImageIcon,
  'footsteps': Footprints,
  'tv': Tv,
  'home': Home,
  'calendar': Calendar,
  'laptop': Laptop,
  'hourglass': Hourglass
};

export function HeroJourneyScreen() {
  const navigate = useNavigate();
  const {
    isLoading,
    totalMoviesWatched,
    averageRating,
    topGenres,
    radarEmotions,
    realTopEmotions,
    emotionPhrase,
    gamificationTitle,
    currentXp,
    currentLevel,
    nextLevelXp,
    userBadges,
    formattedWatchTime,
    currentChallenge,
    isChallengeCompleted,
  } = useHeroStats();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '18px' }}>Carregando sua jornada...</p>
      </div>
    );
  }

  const isRankLight = currentLevel >= 10 && currentLevel < 20;
  const cardTextColor = isRankLight ? '#333' : '#fff';

  const getRankGradient = (level: number) => {
    if (level >= 20) return 'linear-gradient(135deg, #4a00e0, #8e2de2)';
    if (level >= 10) return 'linear-gradient(135deg, #f12711, #f5af19)';
    if (level >= 5) return 'linear-gradient(135deg, #141E30, #243B55)';
    return 'linear-gradient(135deg, #29323c, #485563)';
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 16px', width: '100%', paddingBottom: '100px' }}>
      
      <PageHeader 
        title="Jornada do Herói 🗡️" 
        subtitle="Siga rumo ao topo e descubra suas conquistas!"
      />

      {/* Banner Wrapped */}
      <div 
        onClick={() => navigate('/wrapped')}
        style={{ background: 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '24px', boxShadow: '0 4px 15px rgba(255, 65, 108, 0.4)', transition: 'transform 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Sparkles size={32} color="#FFD700" />
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>Sua Retrospectiva</h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Descubra seus destaques do ano!</p>
          </div>
        </div>
      </div>

      {/* Gamification Card */}
      <div style={{
        background: getRankGradient(currentLevel),
        borderRadius: '16px',
        padding: '32px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '32px',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: '#E50914', padding: '8px 16px', borderRadius: '16px', fontWeight: 'bold', color: 'white', fontSize: '14px' }}>
          Nível {currentLevel}
        </div>
        
        <Trophy size={64} color="#FFD700" style={{ marginBottom: '16px' }} />
        <span style={{ color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '14px', marginBottom: '8px' }}>Sua Patente</span>
        <h2 style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center' }}>{gamificationTitle}</h2>

        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{ width: `${(currentXp % 100)}%`, height: '100%', backgroundColor: '#FFD700', borderRadius: '4px' }}></div>
          </div>
          <div style={{ textAlign: 'center', color: cardTextColor, fontWeight: 'bold', fontSize: '14px' }}>
            {currentXp} / {nextLevelXp} XP
          </div>
        </div>
        
        {currentChallenge && (
          <div style={{ width: '100%', marginTop: '24px', backgroundColor: isChallengeCompleted ? 'rgba(76, 175, 80, 0.1)' : 'rgba(229, 9, 20, 0.1)', border: `1px solid ${isChallengeCompleted ? '#4CAF50' : '#E50914'}`, borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              {isChallengeCompleted ? <Trophy size={16} color="#4CAF50" /> : <Star size={16} color="#FFD700" />}
              <span style={{ color: isChallengeCompleted ? '#4CAF50' : '#FFD700', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                {isChallengeCompleted ? "Desafio Concluído!" : "Desafio da Semana"}
              </span>
            </div>
            <p style={{ color: cardTextColor, fontSize: '14px', fontWeight: 'bold' }}>
              {isChallengeCompleted ? "Você garantiu seu XP bônus!" : currentChallenge.desc}
            </p>
            {!isChallengeCompleted && (
              <p style={{ color: isRankLight ? '#990000' : '#FFD700', fontSize: '12px', fontWeight: 'bold', marginTop: '8px' }}>
                Recompensa: +{currentChallenge.xp} XP
              </p>
            )}
          </div>
        )}
      </div>

      {/* Basic Stats Row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Clock size={32} color="#E50914" style={{ marginBottom: '16px' }} />
          <span style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>{formattedWatchTime}</span>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Tempo de Vida Assistido</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="glass-panel" style={{ flex: 1, padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Film size={32} color="#E50914" style={{ marginBottom: '16px' }} />
            <span style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>{totalMoviesWatched}</span>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Filmes</span>
          </div>
          <div className="glass-panel" style={{ flex: 1, padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Star size={32} color="#FFD700" style={{ marginBottom: '16px' }} />
            <span style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>{averageRating}</span>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Média</span>
          </div>
        </div>
      </div>

      {/* Podium Section */}
      <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', marginBottom: '32px' }}>Gêneros Favoritos</h3>
        {topGenres.length > 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', minHeight: '240px', gap: '16px' }}>
            
            {/* 2nd Place */}
            {topGenres[1] ? (
              <div style={{ flex: 1, maxWidth: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                <span style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '18px' }}>{topGenres[1].count}</span>
                <div style={{ width: '100%', height: '100px', backgroundColor: '#C0C0C0', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'black', fontWeight: 'bold', fontSize: '24px' }}>2º</span>
                </div>
                <span style={{ marginTop: '8px', fontSize: '12px', textAlign: 'center', minHeight: '32px' }}>{topGenres[1].name}</span>
              </div>
            ) : <div style={{ flex: 1, maxWidth: '100px' }}></div>}

            {/* 1st Place */}
            {topGenres[0] ? (
              <div style={{ flex: 1, maxWidth: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                <Star size={24} color="#FFD700" fill="#FFD700" style={{ marginBottom: '8px' }} />
                <span style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '18px' }}>{topGenres[0].count}</span>
                <div style={{ width: '100%', height: '140px', backgroundColor: '#FFD700', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'black', fontWeight: 'bold', fontSize: '24px' }}>1º</span>
                </div>
                <span style={{ marginTop: '8px', fontSize: '12px', textAlign: 'center', minHeight: '32px' }}>{topGenres[0].name}</span>
              </div>
            ) : <div style={{ flex: 1, maxWidth: '100px' }}></div>}

            {/* 3rd Place */}
            {topGenres[2] ? (
              <div style={{ flex: 1, maxWidth: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                <span style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '18px' }}>{topGenres[2].count}</span>
                <div style={{ width: '100%', height: '80px', backgroundColor: '#CD7F32', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'black', fontWeight: 'bold', fontSize: '24px' }}>3º</span>
                </div>
                <span style={{ marginTop: '8px', fontSize: '12px', textAlign: 'center', minHeight: '32px' }}>{topGenres[2].name}</span>
              </div>
            ) : <div style={{ flex: 1, maxWidth: '100px' }}></div>}

          </div>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Avalie filmes para gerar seu pódio!</p>
        )}
      </div>

      {/* Radar Section */}
      <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', marginBottom: '32px' }}>Radar de Emoções</h3>
        {radarEmotions.length === 6 && radarEmotions[0].name !== '' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg width="280" height="240" viewBox="-40 -20 280 240">
              <defs>
                <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#E50914" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#E50914" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="100" cy="100" r="90" fill="url(#glow)" />
              <circle cx="100" cy="100" r="80" stroke="var(--color-border)" strokeWidth="1" fill="none" />
              <circle cx="100" cy="100" r="53" stroke="var(--color-border)" strokeWidth="1" fill="none" />
              <circle cx="100" cy="100" r="26" stroke="var(--color-border)" strokeWidth="1" fill="none" />
              
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                const x2 = 100 + 80 * Math.cos(angle);
                const y2 = 100 + 80 * Math.sin(angle);
                return <line key={`axis-${i}`} x1="100" y1="100" x2={x2} y2={y2} stroke="var(--color-border)" strokeWidth="1" />;
              })}

              <polygon
                points={radarEmotions.map((em, i) => {
                  const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                  const max = em.maxValue;
                  const ratio = max > 0 ? (em.count / max) : 0;
                  const radius = ratio * 80;
                  return `${100 + radius * Math.cos(angle)},${100 + radius * Math.sin(angle)}`;
                }).join(' ')}
                fill="rgba(229, 9, 20, 0.4)"
                stroke="#E50914"
                strokeWidth="2"
              />

              {radarEmotions.map((em, i) => {
                const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                const labelRadius = 95;
                const lx = 100 + labelRadius * Math.cos(angle);
                const ly = 100 + labelRadius * Math.sin(angle);
                return (
                  <text
                    key={`label-${i}`}
                    x={lx}
                    y={ly + 4}
                    fill="white"
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {em.name}
                  </text>
                );
              })}
            </svg>

            {realTopEmotions.length > 0 && (
              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                  Suas Principais Emoções
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '24px' }}>
                  {realTopEmotions.map((em, index) => (
                    <div key={index} style={{ padding: '8px 16px', borderRadius: '16px', backgroundColor: 'var(--color-bg-base)', border: '1px solid var(--color-border)' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{index + 1}º {em.name}</span>
                    </div>
                  ))}
                </div>
                {emotionPhrase && (
                  <p style={{ color: '#E50914', fontSize: '18px', fontStyle: 'italic', textAlign: 'center' }}>"{emotionPhrase}"</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Avalie mais filmes escolhendo suas emoções para gerar o radar.</p>
        )}
      </div>

      {/* Badges Section */}
      <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', marginBottom: '32px' }}>Minhas Conquistas</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center' }}>
          {userBadges.map(b => {
            const Icon = IconMap[b.icon] || Trophy;
            return (
              <div 
                key={b.id} 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  width: '110px',
                  opacity: b.unlocked ? 1 : 0.4
                }}
              >
                <div style={{ 
                  width: '72px', height: '72px', borderRadius: '36px', 
                  backgroundColor: b.unlocked ? `${b.color}22` : 'var(--color-border)',
                  border: `2px solid ${b.unlocked ? b.color : 'var(--color-border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '12px'
                }}>
                  <Icon size={32} color={b.unlocked ? b.color : "var(--color-text-muted)"} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>{b.name}</span>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '4px' }}>{b.description}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
