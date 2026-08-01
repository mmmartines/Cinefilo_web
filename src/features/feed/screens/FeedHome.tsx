import { useState, useEffect } from 'react';
import { PostCard } from '../../../components/PostCard';
import { PageHeader } from '../../../components/PageHeader';
import { supabase } from '../../../services/supabase';
import { useNavigate } from 'react-router-dom';

export function FeedHome() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setCurrentUser(session.user);
      
      const response = await fetch('https://cinefilo-server.vercel.app/api/feed?tab=social', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        setPosts(result.data || []);
      }
    } catch (err) {
      console.error("Erro ao buscar feed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (activityId: string, reactionType: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !currentUser) return;

      const userId = currentUser.id;
      const userName = currentUser.user_metadata?.full_name || 'Usuário';

      // Optimistic update
      setPosts(prev => prev.map(post => {
        const id = post.id || post._id;
        if (id === activityId) {
          let newReactions = [...(post.reactions || [])];
          const existingIdx = newReactions.findIndex((r: any) => r.user_id === userId);
          
          if (existingIdx > -1) {
            if (newReactions[existingIdx].type === reactionType) {
              newReactions.splice(existingIdx, 1);
            } else {
              newReactions[existingIdx].type = reactionType;
            }
          } else {
            newReactions.push({ user_id: userId, type: reactionType, user_name: userName });
          }
          return { ...post, reactions: newReactions };
        }
        return post;
      }));

      // API Call
      await fetch('https://cinefilo-server.vercel.app/api/feed', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ activity_id: activityId, reaction_type: reactionType })
      });
    } catch (err) {
      console.error("Erro ao reagir", err);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 16px' }}>
      <PageHeader 
        title="Feed Social 🌟" 
        subtitle="O que seus amigos e a comunidade estão assistindo e comentando."
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--color-text-muted)' }}>
          <div className="spinner" style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--color-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }} />
          <h2 style={{ fontSize: '20px' }}>Carregando atividades...</h2>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--color-text-muted)' }}>
          <h2 style={{ fontSize: '24px' }}>Nenhuma atividade recente.</h2>
        </div>
      ) : (
        <div>
          {posts.map(post => (
            <PostCard 
              key={post.id || post._id} 
              post={post} 
              currentUser={currentUser} 
              onReact={handleReaction} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
