import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { database } from '../../../services/database';
import { supabase } from '../../../services/supabase';
import { ArrowLeft, Play, FastForward, Rewind, Sparkles } from 'lucide-react';

export function WrappedScreen() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const s = await database.getUserStats(session.user.id);
      setStats(s || { level: 1, xp: 0, moviesWatched: 0, watchTimeMinutes: 0 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const slides = [
    {
      title: "Sua Retrospectiva Cinefilo",
      text: "Um ano cheio de emoções e grandes histórias na tela.",
      icon: <Sparkles size={80} color="#FFD700" />
    },
    {
      title: "Tempo de Tela",
      text: `Você passou ${Math.floor((stats?.watchTimeMinutes || 0) / 60)} horas imerso em outros mundos.`,
      icon: <Play size={80} color="#E50914" />
    },
    {
      title: "Filmes Assistidos",
      text: `Foram ${stats?.moviesWatched || 0} obras cinematográficas consumidas. Que maratona!`,
      icon: <FastForward size={80} color="#4CAF50" />
    },
    {
      title: "Jornada do Herói",
      text: `Você alcançou o Nível ${stats?.level || 1} e acumulou ${stats?.xp || 0} XP!`,
      icon: <Rewind size={80} color="#2196F3" />
    }
  ];

  if (loading) {
    return (
      <div style={{ flex: 1, minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner" style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid #E50914', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const slide = slides[currentSlide];

  return (
    <div style={{ flex: 1, minHeight: '100vh', background: 'linear-gradient(135deg, #180000 0%, #E50914 100%)', display: 'flex', flexDirection: 'column', color: '#FAFAFA' }}>
      
      <div style={{ position: 'absolute', top: 24, left: 16, zIndex: 20 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(0,0,0,0.5)', border: 'none', color: '#FAFAFA', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '12px', borderRadius: '50%' }}>
          <ArrowLeft size={24} />
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px', textAlign: 'center', position: 'relative' }}>
        <div key={currentSlide} className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '500px' }}>
          <div style={{ marginBottom: '40px', animation: 'float 3s ease-in-out infinite' }}>
            {slide.icon}
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '24px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{slide.title}</h1>
          <p style={{ fontSize: '20px', lineHeight: '1.5', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{slide.text}</p>
        </div>
      </div>

      <style>
        {`
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
          .fade-in-up { animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
          @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-20px); } 100% { transform: translateY(0px); } }
        `}
      </style>

      {/* Navigation Controls */}
      <div style={{ padding: '40px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '500px', width: '100%', margin: '0 auto' }}>
        <button 
          onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
          style={{ background: 'transparent', border: 'none', color: '#FAFAFA', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', opacity: currentSlide === 0 ? 0.3 : 1 }}
          disabled={currentSlide === 0}
        >
          Anterior
        </button>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {slides.map((_, i) => (
            <div key={i} style={{ width: i === currentSlide ? '24px' : '8px', height: '8px', borderRadius: '4px', background: i === currentSlide ? '#FFF' : 'rgba(255,255,255,0.3)', transition: 'all 0.3s' }} />
          ))}
        </div>

        {currentSlide < slides.length - 1 ? (
          <button 
            onClick={() => setCurrentSlide(currentSlide + 1)}
            style={{ background: '#FFF', color: '#E50914', border: 'none', padding: '12px 24px', borderRadius: '24px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Próximo
          </button>
        ) : (
          <button 
            onClick={() => navigate(-1)}
            style={{ background: '#FFF', color: '#E50914', border: 'none', padding: '12px 24px', borderRadius: '24px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Finalizar
          </button>
        )}
      </div>

    </div>
  );
}
