import { useState, useEffect, useRef } from 'react';
import { Search, MessageSquare, Users, Sparkles, Send, ArrowLeft } from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { database } from '../../../services/database';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader';

export function InboxHome() {
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat.id);
      
      const subscription = database.subscribeToMessages(activeChat.id, (newMessage) => {
        setMessages(prev => [...prev, newMessage]);
        setTimeout(scrollToBottom, 100);
      });

      return () => {
        if (typeof subscription === 'function') {
          subscription();
        }
      };
    }
  }, [activeChat]);

  const loadRooms = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setCurrentUser(session.user);
      const rooms = await database.getChats();
      setChatRooms(rooms || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRooms(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    setLoadingMessages(true);
    try {
      const msgs = await database.getMessages(chatId);
      setMessages(msgs || []);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !activeChat || !currentUser) return;
    
    const userName = currentUser.user_metadata?.full_name || 'Usuário';
    const userAvatar = currentUser.user_metadata?.avatar_url || 'https://i.pravatar.cc/150?img=68';
    
    try {
      await database.sendMessage(activeChat.id, newMessage.trim(), userName, userAvatar);
      setNewMessage('');
    } catch (err) {
      console.error("Erro ao enviar mensagem", err);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 16px', width: '100%', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      
      <PageHeader 
        title="Fóruns de Filmes 💬" 
        subtitle="Converse sobre os últimos lançamentos."
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Lista de Fóruns */}
        {!activeChat && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
            {loadingRooms ? (
             <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>Carregando salas...</div>
          ) : chatRooms.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>Nenhum fórum disponível.</div>
          ) : chatRooms.map(chat => (
            <div 
              key={chat.id} 
              onClick={() => setActiveChat(chat)}
              className="glass-panel" style={{ 
                display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', 
                borderRadius: '16px', cursor: 'pointer',
                background: activeChat?.id === chat.id ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)',
                border: '1px solid transparent'
              }}
            >
              <img src={`https://image.tmdb.org/t/p/w200${chat.movie_poster}`} alt={chat.movie_title} style={{ width: '56px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <h4 style={{ fontWeight: 'bold', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {chat.movie_title}
                  </h4>
                </div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {chat.last_message_content || 'Tocar para abrir'}
                </p>
              </div>
            </div>
            ))}
            </div>
          </div>
        )}

        {/* Área do Chat Aberto */}
        {activeChat && (
          <div className="glass-panel" style={{ flex: 1, borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header do Chat */}
            <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(0,0,0,0.5)' }}>
              <button 
                onClick={() => setActiveChat(null)} 
                style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '8px', marginRight: '8px' }}
              >
                <ArrowLeft size={24} />
              </button>
              <img src={`https://image.tmdb.org/t/p/w200${activeChat.movie_poster}`} alt={activeChat.movie_title} style={{ width: '48px', height: '70px', borderRadius: '8px' }} />
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Chat Oficial: {activeChat.movie_title}</h3>
                <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>Cinéfilos discutindo</span>
              </div>
            </div>

            {/* Mensagens */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {loadingMessages ? (
                 <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>Carregando mensagens...</div>
              ) : messages.length === 0 ? (
                 <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>Seja o primeiro a enviar uma mensagem!</div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.user_id === currentUser?.id;
                  return (
                    <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: '12px', maxWidth: '75%' }}>
                      <img src={msg.user_avatar || 'https://i.pravatar.cc/150'} style={{ width: '32px', height: '32px', borderRadius: '16px' }} />
                      <div>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block', textAlign: isMe ? 'right' : 'left' }}>
                          {isMe ? 'Você' : msg.user_name}
                        </span>
                        <div style={{ background: isMe ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)', color: 'white', padding: '12px 16px', borderRadius: isMe ? '16px 0px 16px 16px' : '0px 16px 16px 16px' }}>
                          <p>{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '24px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '16px', background: 'rgba(0,0,0,0.5)' }}>
              <input 
                type="text" 
                placeholder={`Conversar sobre ${activeChat.movie_title}...`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', borderRadius: '12px', color: 'white' }}
              />
              <button onClick={handleSend} style={{ width: '56px', height: '56px', background: 'var(--color-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
                <Send size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
