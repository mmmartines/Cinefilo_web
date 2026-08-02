import { useState, useEffect } from 'react';
import { Settings, Film, Clock, Trophy, Target, Award, Star } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { PostCard } from '../../../components/PostCard';
import { supabase } from '../../../services/supabase';
import { database } from '../../../services/database';
import { useNavigate } from 'react-router-dom';

export function ProfileHome() {
  const [activeTab, setActiveTab] = useState<'resumo' | 'atividades'>('resumo');
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      
      setProfile({
        name: session.user.user_metadata?.full_name || 'Cinéfilo',
        avatar: session.user.user_metadata?.avatar_url || 'https://i.pravatar.cc/150?img=68'
      });
      
      const userStats = await database.getUserStats(session.user.id);
      setStats(userStats);
      
      const response = await fetch('https://cinefilo-server.vercel.app/api/feed?tab=me', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setActivities(result.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentXp = stats?.xp || 0;
  const nextLevelXp = 5000;
  const progress = Math.min(100, Math.round((currentXp / nextLevelXp) * 100));

  const formatWatchTime = (totalMinutes: number) => {
    if (totalMinutes === 0) return '0 min';

    const years = Math.floor(totalMinutes / (60 * 24 * 365));
    let remainder = totalMinutes % (60 * 24 * 365);
    
    const months = Math.floor(remainder / (60 * 24 * 30));
    remainder = remainder % (60 * 24 * 30);
    
    const weeks = Math.floor(remainder / (60 * 24 * 7));
    remainder = remainder % (60 * 24 * 7);
    
    const days = Math.floor(remainder / (60 * 24));
    remainder = remainder % (60 * 24);
    
    const hours = Math.floor(remainder / 60);
    const mins = remainder % 60;
    
    const parts = [];
    if (years > 0) parts.push(`${years}a`);
    if (months > 0) parts.push(`${months}mês`);
    if (weeks > 0) parts.push(`${weeks}sem`);
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0) parts.push(`${mins}min`);
    
    return parts.join(' ');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0', color: 'white' }}>
        <div className="spinner" style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--color-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }} />
        <h2 style={{ fontSize: '20px' }}>Carregando perfil...</h2>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ padding: '0 16px', width: '100%' }}>
      
      <PageHeader 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img src={profile?.avatar || 'https://i.pravatar.cc/150?img=68'} alt="Avatar" style={{ width: '56px', height: '56px', borderRadius: '28px', objectFit: 'cover', border: '2px solid var(--color-primary)' }} />
            <span>{profile?.name || ''}</span>
          </div>
        } 
        rightElement={
          <button 
            onClick={() => navigate('/settings')}
            style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', color: 'white', border: 'none' }}
          >
            <Settings size={24} />
          </button>
        }
      />

      <div style={{ display: 'flex', gap: '12px', marginTop: '-24px', marginBottom: '32px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,215,0,0.1)', color: '#FFD700', padding: '4px 12px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold' }}>
          <Trophy size={16} /> Nível {stats?.level || 1}
        </span>
      </div>

      {/* Navegação de Abas */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
        <button 
          onClick={() => setActiveTab('resumo')}
          style={{ padding: '8px 16px', fontWeight: 'bold', color: activeTab === 'resumo' ? 'white' : 'var(--color-text-muted)', borderBottom: activeTab === 'resumo' ? '2px solid var(--color-primary)' : '2px solid transparent', transition: 'all 0.2s' }}
        >
          Resumo & Gamificação
        </button>
        <button 
          onClick={() => setActiveTab('atividades')}
          style={{ padding: '8px 16px', fontWeight: 'bold', color: activeTab === 'atividades' ? 'white' : 'var(--color-text-muted)', borderBottom: activeTab === 'atividades' ? '2px solid var(--color-primary)' : '2px solid transparent', transition: 'all 0.2s' }}
        >
          Minhas Atividades
        </button>
      </div>

      {/* Aba: Resumo */}
      {activeTab === 'resumo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontWeight: 'bold' }}>Progresso Nível {stats?.level || 1}</span>
              <span style={{ color: 'var(--color-text-muted)' }}>{currentXp} / {nextLevelXp} XP</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #FFD700, #FFA500)', borderRadius: '4px' }}></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', background: 'rgba(229, 9, 20, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Film color="var(--color-primary)" size={24} />
              </div>
              <div>
                <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats?.total_movies || 0}</span>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Filmes Assistidos</p>
              </div>
            </div>
            
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', background: 'rgba(255, 215, 0, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Clock color="#FFD700" size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold', lineHeight: 1.2, display: 'block', marginBottom: '4px' }}>
                  {formatWatchTime(stats?.total_minutes || 0)}
                </span>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', margin: 0 }}>Tempo de Tela</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Aba: Atividades */}
      {activeTab === 'atividades' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--color-text-muted)' }}>
              <p>Nenhuma atividade registrada ainda.</p>
            </div>
          ) : (
            activities.map(post => (
              <PostCard key={post.id || post._id} post={post} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
