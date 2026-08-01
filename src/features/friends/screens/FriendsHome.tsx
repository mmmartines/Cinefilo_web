import { useState, useEffect } from 'react';
import { Search, UserPlus, Users, UserCheck, Trophy } from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { database } from '../../../services/database';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader';

type FriendTab = 'friends' | 'requests' | 'search';

export function FriendsHome() {
  const [activeTab, setActiveTab] = useState<FriendTab>('friends');
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setCurrentUserId(session.user.id);

      if (activeTab === 'friends') {
        try {
          const response = await fetch('https://cinefilo-server.vercel.app/api/friends', {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          if (response.ok) {
            const result = await response.json();
            let apiFriends = result.data || [];
            
            // Puxa as informações reais de tempo de tela e nível do perfil local logado
            const localUser = await database.getCurrentUser();
            const watchedList = await database.getWatchedMovies(session.user.id) || [];
            const watchedOnly = Array.isArray(watchedList) ? watchedList.filter((m: any) => m.status === 'watched') : [];
            const localMinutes = watchedOnly.reduce((acc: number, curr: any) => acc + (curr.runtime || 0), 0);
            
            const totalMovies = watchedOnly.length;
            const xp = (totalMovies * 10);
            const localLevel = Math.floor(xp / 100) + 1;
            
            const avatarUrl = await window.localStorage.getItem('@cinefilo_avatar') || localUser?.avatar_url || session.user.user_metadata?.avatar_url || 'https://i.pravatar.cc/150';
            const userName = localUser?.name || localUser?.nickname || localUser?.full_name || session.user.user_metadata?.full_name || 'Você';

            // Verifica se o usuário atual já veio na lista da API
            const existingMeIndex = apiFriends.findIndex((f: any) => f.isMe || f.id === session.user.id || f.supabase_id === session.user.id);
            
            if (existingMeIndex >= 0) {
              // Sobrescreve os dados do usuário da API com os dados locais 100% atualizados
              apiFriends[existingMeIndex] = {
                ...apiFriends[existingMeIndex],
                name: userName,
                avatar_url: avatarUrl,
                total_minutes: localMinutes,
                level: localLevel,
                isMe: true
              };
            } else {
              // Caso a API não tenha retornado o usuário logado, nós o injetamos
              apiFriends.push({
                id: session.user.id,
                name: userName,
                avatar_url: avatarUrl,
                total_minutes: localMinutes,
                level: localLevel,
                isMe: true
              });
            }
            
            apiFriends.sort((a: any, b: any) => {
               const aMins = a.total_minutes || a.stats?.total_minutes || 0;
               const bMins = b.total_minutes || b.stats?.total_minutes || 0;
               return bMins - aMins;
            });
            
            setFriends(apiFriends);
          }
        } catch (e) {
          console.error("Erro ao buscar amigos", e);
        }
      } else if (activeTab === 'requests') {
        const response = await fetch('https://cinefilo-server.vercel.app/api/friend_requests', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (response.ok) {
          const result = await response.json();
          setRequests(result.data?.received || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondRequest = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const response = await fetch('https://cinefilo-server.vercel.app/api/friend_requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ request_id: requestId, action })
      });
      
      if (response.ok) {
        setRequests(prev => prev.filter(req => req.id !== requestId));
        if (action === 'accept') {
          alert('Pedido aceito com sucesso!');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao processar pedido');
    }
  };

  const handleSendRequest = async () => {
    if (searchQuery.trim().length < 3) {
      alert('O apelido deve conter no mínimo 3 caracteres.');
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('https://cinefilo-server.vercel.app/api/friend_requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ nickname: searchQuery.trim() })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Falha ao enviar solicitação');
      }

      alert(result.message || 'Solicitação enviada com sucesso!');
      setSearchQuery('');
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 16px', width: '100%' }}>
      <PageHeader 
        title="Sua Rede 🤝" 
        subtitle="Conecte-se com outros cinéfilos."
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <button 
          onClick={() => setActiveTab('friends')}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '16px', fontWeight: 'bold', 
            color: activeTab === 'friends' ? 'var(--color-primary)' : 'var(--color-text-muted)' 
          }}
        >
          <Users size={20} /> Meus Amigos
        </button>
        <button 
          onClick={() => setActiveTab('requests')}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '16px', fontWeight: 'bold', 
            color: activeTab === 'requests' ? 'var(--color-primary)' : 'var(--color-text-muted)' 
          }}
        >
          <UserCheck size={20} /> Pedidos{activeTab === 'requests' ? ` (${requests.length})` : ''}
        </button>
        <button 
          onClick={() => setActiveTab('search')}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '16px', fontWeight: 'bold', 
            color: activeTab === 'search' ? 'var(--color-primary)' : 'var(--color-text-muted)' 
          }}
        >
          <Search size={20} /> Buscar Usuários
        </button>
      </div>

      {/* Listas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {loading && activeTab !== 'search' ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--color-text-muted)' }}>
            <div className="spinner" style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--color-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }} />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            Carregando...
          </div>
        ) : activeTab === 'friends' ? (
          friends.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>Nenhum amigo encontrado para o ranking.</div>
          ) : (
            friends.map((friend, index) => {
              const friendId = friend.friend_id || friend.id || friend.supabase_id;
              const isMe = friend.isMe; // Trust the API's isMe boolean!
              
              let borderStyle = '1px solid var(--color-border)';
              if (index === 0) borderStyle = '2px solid #FFD700'; // Ouro
              else if (index === 1) borderStyle = '2px solid #C0C0C0'; // Prata
              else if (index === 2) borderStyle = '2px solid #CD7F32'; // Bronze

              const formatRuntime = (minutes: number) => {
                if (!minutes) return '0h';
                const h = Math.floor(minutes / 60);
                const m = minutes % 60;
                return `${h}h${m > 0 ? ` ${m}m` : ''}`;
              };
              
              const estimatedXp = friend.xp || ((friend.total_movies || 0) * 10);
              const estimatedLevel = friend.level || Math.floor(estimatedXp / 100) + 1;
              const screenTime = formatRuntime(friend.total_minutes || friend.stats?.total_minutes || 0);
              const avatar = friend.avatar_url || friend.avatar || friend.friend_avatar || 'https://i.pravatar.cc/150';
              const name = friend.name || friend.friend_name;

              return (
                <div key={friendId} className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderRadius: '16px', gap: '16px', border: borderStyle, position: 'relative' }}>
                  {index < 3 && (
                    <div style={{ position: 'absolute', top: '-12px', left: '-12px', width: '32px', height: '32px', background: 'var(--color-bg-element)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', border: borderStyle, zIndex: 1 }}>
                       <Trophy size={16} color={index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'} />
                    </div>
                  )}
                  <div style={{ width: '24px', textAlign: 'center', fontWeight: 'bold', fontSize: '18px', color: index < 3 ? 'white' : 'var(--color-text-muted)' }}>
                    {index + 1}º
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
                    <img src={avatar} alt={name} style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-full)', border: borderStyle, objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isMe ? 'var(--color-primary)' : 'white' }}>
                        {name} {isMe && <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 'normal' }}>(Você)</span>}
                      </h3>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px' }}>
                        <p style={{ color: 'white', backgroundColor: 'var(--color-primary)', padding: '2px 6px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold' }}>Nv {estimatedLevel}</p>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>🎬 {friend.total_movies || 0} filmes • ⏱️ {screenTime}</p>
                      </div>
                    </div>
                  </div>
                  {!isMe && (
                    <button onClick={() => navigate(`/friend/${friendId}`)} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', flexShrink: 0, color: 'white', border: 'none' }}>Ver Perfil</button>
                  )}
                </div>
              );
            })
          )
        ) : activeTab === 'requests' ? (
          requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>Nenhum pedido de amizade pendente.</div>
          ) : (
            requests.map(req => (
              <div key={req.id} className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img src={req.sender_avatar || 'https://i.pravatar.cc/150'} alt={req.sender_name} style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-full)', border: '2px solid var(--color-border)' }} />
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{req.sender_name}</h3>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleRespondRequest(req.id, 'accept')} style={{ padding: '8px 16px', background: 'var(--color-primary)', color: 'white', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Aceitar</button>
                  <button onClick={() => handleRespondRequest(req.id, 'reject')} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Recusar</button>
                </div>
              </div>
            ))
          )
        ) : activeTab === 'search' && (
          <div style={{ padding: '32px', border: '1px dashed var(--color-border)', borderRadius: '16px', textAlign: 'center' }}>
            <div style={{ position: 'relative', maxWidth: '400px', margin: '0 auto 24px auto', display: 'flex', gap: '12px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={20} color="var(--color-text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Busque por @nickname" 
                  style={{ width: '100%', padding: '16px 16px 16px 48px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', borderRadius: '12px', color: 'white' }}
                />
              </div>
              <button 
                onClick={handleSendRequest}
                style={{ padding: '0 24px', background: 'var(--color-primary)', color: 'white', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Adicionar
              </button>
            </div>
            <UserPlus size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 16px auto' }} />
            <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Encontre novos amigos</h2>
            <p style={{ color: 'var(--color-text-muted)' }}>Digite o nickname exato para pesquisar e adicionar usuários na Cinelândia.</p>
          </div>
        )}

      </div>
    </div>
  );
}
