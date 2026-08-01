import { Send, Bot, User as UserIcon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../../services/supabase';
import { PageHeader } from '../../../components/PageHeader';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function AiChatHome() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Olá! Eu sou a Cinemateca 🎬\nEstou aqui para falar sobre filmes, diretores, atores e te dar recomendações. O que você quer assistir hoje?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: inputText.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const apiUrl = 'https://cinefilo-server.vercel.app';
      
      const messagesPayload = messages.map(m => ({ role: m.role, content: m.content })).concat({ role: 'user', content: userMessage.content });

      const response = await fetch(`${apiUrl}/api/ai?action=chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ messages: messagesPayload })
      });

      const result = await response.json();
      if (result.success) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: result.message }]);
      } else {
        alert(result.error || 'Falha ao responder');
      }
    } catch (e) {
      console.error(e);
      alert('Não foi possível se conectar com a Cinemateca.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 16px', height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      
      <PageHeader 
        title="Cinemateca IA 🤖"
        subtitle="Sua inteligência artificial focada em cinema."
      />

      <div className="glass-panel" style={{ flex: 1, borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Histórico de Chat */}
        <div ref={scrollRef} style={{ flex: 1, padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {messages.map(msg => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} style={{ alignSelf: isUser ? 'flex-end' : 'flex-start', display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', gap: '16px', maxWidth: '85%' }}>
                <div style={{ width: '40px', height: '40px', background: isUser ? 'rgba(255,255,255,0.2)' : 'transparent', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                  {isUser ? <UserIcon size={20} color="white" /> : <img src="/cinemateca_mascot.jpg" alt="Cinemateca" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ background: isUser ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)', color: 'white', padding: '16px 24px', borderRadius: isUser ? '24px 0px 24px 24px' : '0px 24px 24px 24px' }}>
                  <p style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap', margin: 0 }}>
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '16px', maxWidth: '85%' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                <img src="/cinemateca_mascot.jpg" alt="Cinemateca" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)', padding: '16px 24px', borderRadius: '0px 24px 24px 24px', fontStyle: 'italic' }}>
                <p style={{ margin: 0 }}>A Cinemateca está digitando...</p>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: '24px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '16px', background: 'rgba(0,0,0,0.5)' }}>
          <input 
            type="text" 
            placeholder="Peça uma recomendação..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', borderRadius: '12px', color: 'white', fontSize: '16px' }}
          />
          <button 
            onClick={sendMessage}
            disabled={!inputText.trim() || loading}
            style={{ width: '56px', height: '56px', background: (!inputText.trim() || loading) ? 'var(--color-border)' : 'var(--color-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: (!inputText.trim() || loading) ? 'not-allowed' : 'pointer' }}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
