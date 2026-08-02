import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Film, User, Compass, Bookmark, LogOut, Users, MessageSquare, PlayCircle, Bot, Trophy, Settings, Search, Dices, HeartHandshake, UsersRound, BarChart2, Gift, Menu, X } from 'lucide-react';
import { supabase } from './services/supabase';
import { database } from './services/database';
import { CatalogHome } from './features/catalog/screens/CatalogHome';
import { MovieDetails } from './features/catalog/screens/MovieDetails';

import { MyMoviesHome } from './features/myMovies/screens/MyMoviesHome';
import { FeedHome } from './features/feed/screens/FeedHome';
import { ProfileHome } from './features/profile/screens/ProfileHome';
import { HeroJourneyScreen } from './features/stats/screens/HeroJourneyScreen';
import { AuthHome } from './features/auth/screens/AuthHome';
import { FriendsHome } from './features/friends/screens/FriendsHome';
import { FriendProfile } from './features/friends/screens/FriendProfile';
import { InboxHome } from './features/chat/screens/InboxHome';
import { AiChatHome } from './features/ai/screens/AiChatHome';
import { SetupNickname } from './features/auth/screens/SetupNickname';
import { Preferences } from './features/auth/screens/Preferences';
import { SettingsHome } from './features/profile/screens/SettingsHome';
import { RouletteScreen } from './features/catalog/screens/RouletteScreen';
import { MatchScreen } from './features/friends/screens/MatchScreen';
import { WrappedScreen } from './features/stats/screens/WrappedScreen';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [needsNickname, setNeedsNickname] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [appUserStats, setAppUserStats] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSession = async (session: any) => {
    if (!session) {
      setSession(null);
      setLoadingAuth(false);
      return;
    }
    
    setSession(session);
    
    // Check nickname
    try {
      const response = await fetch('https://cinefilo-server.vercel.app/api/users', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (response.ok) {
        const apiData = await response.json();
        const remoteNickname = apiData.data?.nickname || apiData.data?.tag || apiData.nickname || apiData.tag;
        if (!remoteNickname) {
          setNeedsNickname(true);
        } else {
          setNeedsNickname(false);
        }
      }
    } catch(e) {}
    
    try {
      const stats = await database.getUserStats(session.user.id);
      setAppUserStats(stats);
    } catch(e) {}
    
    setLoadingAuth(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loadingAuth) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--color-bg)', color: 'white' }}>
        <div className="spinner" style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--color-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
        <h2>Carregando...</h2>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!session) {
    return (
      <Router>
        <div style={{ width: '100vw', height: '100vh' }}>
          <AuthHome />
        </div>
      </Router>
    );
  }

  if (needsNickname) {
    return (
      <Router>
        <div style={{ width: '100vw', height: '100vh' }}>
          <SetupNickname />
        </div>
      </Router>
    );
  }

  return (
    <Router>
      <div className="app-container">
        {/* Sidebar */}
        <aside className="desktop-sidebar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <img src="/icon.png" alt="Cinelândia" style={{ width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover' }} />
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '-0.5px' }}>Cinelândia</h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--color-bg-element)', borderRadius: '16px', border: '1px solid var(--color-border)', marginBottom: '24px' }}>
            <img src={session?.user?.user_metadata?.avatar_url || 'https://i.pravatar.cc/150?img=68'} alt="User" style={{ width: '48px', height: '48px', borderRadius: '24px', objectFit: 'cover' }} />
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {(session?.user?.user_metadata?.full_name || 'Cinéfilo').split(' ')[0]}
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255, 215, 0, 0.1)', padding: '2px 8px', borderRadius: '8px', marginTop: '4px' }}>
                <Trophy size={12} color="#FFD700" />
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#FFD700' }}>Nível {appUserStats?.level || 1}</span>
              </div>
            </div>
          </div>
          
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', background: 'var(--color-bg-element)', color: 'white' }}>
              <Film size={20} />
              <span>Catálogo</span>
            </Link>
            <Link to="/my-movies" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', color: 'var(--color-text-muted)' }}>
              <PlayCircle size={20} />
              <span>Meus Filmes</span>
            </Link>
            <Link to="/roulette" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', color: 'var(--color-text-muted)' }}>
              <Dices size={20} />
              <span>Roleta de Filmes</span>
            </Link>
            <Link to="/friends" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', color: 'var(--color-text-muted)' }}>
              <Users size={20} />
              <span>Rede & Amigos</span>
            </Link>
            <Link to="/inbox" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', color: 'var(--color-text-muted)' }}>
              <MessageSquare size={20} />
              <span>Mensagens</span>
            </Link>
            <Link to="/feed" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', color: 'var(--color-text-muted)' }}>
              <Compass size={20} />
              <span>Feed Social</span>
            </Link>
            <Link to="/journey" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', color: '#FFD700', background: 'rgba(255, 215, 0, 0.1)' }}>
              <Trophy size={20} />
              <span style={{ fontWeight: 'bold' }}>Jornada do Herói</span>
            </Link>
            <Link to="/ai" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', color: '#9C27B0', background: 'rgba(156, 39, 176, 0.1)' }}>
              <Bot size={20} />
              <span style={{ fontWeight: 'bold' }}>Cinemateca IA</span>
            </Link>
            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', color: 'var(--color-text-muted)' }}>
              <User size={20} />
              <span>Meu Perfil</span>
            </Link>
          </nav>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px' }}>
            <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', color: 'var(--color-primary)', fontWeight: 'bold', background: 'rgba(229, 9, 20, 0.1)', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
              <LogOut size={20} />
              <span>Sair da Conta</span>
            </button>
          </div>
        </aside>

        {/* Mobile Bottom Navigation */}
        <nav className="mobile-bottom-bar glass-panel">
          <Link to="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--color-text-main)', padding: '8px' }}>
            <Film size={24} />
            <span style={{ fontSize: '10px' }}>Catálogo</span>
          </Link>
          <Link to="/friends" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)', padding: '8px' }}>
            <Users size={24} />
            <span style={{ fontSize: '10px' }}>Rede</span>
          </Link>
          <Link to="/inbox" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)', padding: '8px' }}>
            <MessageSquare size={24} />
            <span style={{ fontSize: '10px' }}>Chat</span>
          </Link>
          <Link to="/profile" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)', padding: '8px' }}>
            <User size={24} />
            <span style={{ fontSize: '10px' }}>Perfil</span>
          </Link>
          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            style={{ background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)', padding: '8px', cursor: 'pointer' }}
          >
            <Menu size={24} />
            <span style={{ fontSize: '10px' }}>Mais</span>
          </button>
        </nav>

        {/* Mobile Full Screen Menu Drawer */}
        {isMobileMenuOpen && (
           <div className="mobile-drawer overlay glass-panel" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, padding: '24px', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.95)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <img src="/icon.png" alt="Cinelândia" style={{ width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover' }} />
                 <h1 style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '-0.5px' }}>Cinelândia</h1>
               </div>
               <button onClick={() => setIsMobileMenuOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', padding: '8px', cursor: 'pointer' }}>
                  <X size={32} />
               </button>
             </div>
             
             <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '32px' }}>
                <Link onClick={() => setIsMobileMenuOpen(false)} to="/my-movies" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '18px' }}>
                  <PlayCircle size={28} />
                  <span>Meus Filmes</span>
                </Link>
                <Link onClick={() => setIsMobileMenuOpen(false)} to="/roulette" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '18px' }}>
                  <Dices size={28} />
                  <span>Roleta de Filmes</span>
                </Link>
                <Link onClick={() => setIsMobileMenuOpen(false)} to="/feed" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '18px' }}>
                  <Compass size={28} />
                  <span>Feed Social</span>
                </Link>
                <Link onClick={() => setIsMobileMenuOpen(false)} to="/journey" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '16px', background: 'rgba(255, 215, 0, 0.1)', color: '#FFD700', fontSize: '18px' }}>
                  <Trophy size={28} />
                  <span style={{ fontWeight: 'bold' }}>Jornada do Herói</span>
                </Link>
                <Link onClick={() => setIsMobileMenuOpen(false)} to="/ai" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '16px', background: 'rgba(156, 39, 176, 0.1)', color: '#9C27B0', fontSize: '18px' }}>
                  <Bot size={28} />
                  <span style={{ fontWeight: 'bold' }}>Cinemateca IA</span>
                </Link>
                
                <div style={{ marginTop: 'auto', paddingTop: '32px' }}>
                  <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '16px', color: 'var(--color-primary)', fontWeight: 'bold', background: 'rgba(229, 9, 20, 0.1)', border: 'none', cursor: 'pointer', width: '100%', fontSize: '18px' }}>
                    <LogOut size={28} />
                    <span>Sair da Conta</span>
                  </button>
                </div>
             </div>
           </div>
        )}

        {/* Main Content Area */}
        <main className="main-content" style={{ position: 'relative' }}>
          <Routes>
            <Route path="/" element={<CatalogHome />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
            <Route path="/my-movies" element={<MyMoviesHome />} />
            <Route path="/friends" element={<FriendsHome />} />
            <Route path="/friend/:id" element={<FriendProfile />} />
            <Route path="/inbox" element={<InboxHome />} />
            <Route path="/feed" element={<FeedHome />} />
            <Route path="/ai" element={<AiChatHome />} />
            <Route path="/profile" element={<ProfileHome />} />
            <Route path="/journey" element={<HeroJourneyScreen />} />
            <Route path="/setup-nickname" element={<SetupNickname />} />
            <Route path="/preferences" element={<Preferences />} />
            <Route path="/settings" element={<SettingsHome />} />
            <Route path="/roulette" element={<RouletteScreen />} />
            <Route path="/match/:friendId" element={<MatchScreen />} />
            <Route path="/wrapped" element={<WrappedScreen />} />
            {/* Rota de fallback caso tente acessar algo inexistente */}
            <Route path="*" element={<CatalogHome />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
