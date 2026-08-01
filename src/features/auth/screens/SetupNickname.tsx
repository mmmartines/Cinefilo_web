import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../services/supabase';
import { database } from '../../../services/database';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';

export function SetupNickname() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [nickname, setNickname] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
        setUser({ id: session.user.id, name });
        if (name) {
          fetchSuggestions(name);
        }
      }
    });
  }, []);

  const fetchSuggestions = async (name: string) => {
    try {
      const apiUrl = 'https://cinefilo-server.vercel.app';
      const res = await fetch(`${apiUrl}/api/public?action=suggest-nickname&name=` + encodeURIComponent(name));
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setSuggestions(json.suggestions || (json.nickname ? [json.nickname] : []));
        }
      }
    } catch (e) {
      console.log('Error fetching suggestions', e);
    }
  };

  useEffect(() => {
    const cleanNick = nickname.trim().toLowerCase().replace(/[^a-z0-9._]/g, '');
    
    if (cleanNick !== nickname) {
      setNickname(cleanNick);
      return;
    }

    if (!cleanNick) {
      setIsAvailable(null);
      setErrorMsg('');
      return;
    }

    if (cleanNick.length < 3) {
      setIsAvailable(false);
      setErrorMsg('Minimo 3 caracteres.');
      return;
    }

    const validate = setTimeout(async () => {
      setIsValidating(true);
      setErrorMsg('');
      try {
        const apiUrl = 'https://cinefilo-server.vercel.app';
        const res = await fetch(`${apiUrl}/api/public?action=check-nickname&nickname=` + encodeURIComponent(cleanNick));
        if (res.ok) {
          const json = await res.json();
          setIsAvailable(json.available);
          if (!json.available) {
            setErrorMsg('Apelido ja esta em uso.');
            fetchSuggestions(cleanNick); // Fetch alternatives based on what they tried
          } else {
            setSuggestions([]); // Clear suggestions if available
          }
        }
      } catch (e) {
        setIsAvailable(null);
      } finally {
        setIsValidating(false);
      }
    }, 500);

    return () => clearTimeout(validate);
  }, [nickname]);

  const handleSubmit = async () => {
    if (!nickname || !isAvailable || isValidating || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const apiUrl = 'https://cinefilo-server.vercel.app';
        const res = await fetch(`${apiUrl}/api/users`, {
          method: 'PUT',
          headers: {
            'Authorization': 'Bearer ' + session.access_token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ nickname })
        });
        
        if (!res.ok) {
          throw new Error('Falha ao salvar apelido no servidor.');
        }
      }

      const currentUser = await database.getCurrentUser();
      if (currentUser) {
        await database.setCurrentUser({ ...currentUser, nickname });
      }
      
      window.location.href = '/preferences';
    } catch (e: any) {
      setErrorMsg(e.message || 'Erro ao salvar apelido.');
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ flex: 1, minHeight: '100vh', background: 'linear-gradient(180deg, #09090b 0%, #180000 50%, #2b0000 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      
      <div style={{ width: '100%', maxWidth: '1000px', alignSelf: 'flex-start', marginBottom: '40px' }}>
        <PageHeader 
          title="Defina seu @nickname"
          subtitle="Atenção: O nickname é único e NÃO poderá ser alterado no futuro. Ele será usado para que seus amigos possam te adicionar."
        />
      </div>

      <div style={{ maxWidth: '400px', width: '100%' }}>

        <div style={{ background: 'rgba(24, 24, 27, 0.7)', backdropFilter: 'blur(10px)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '0 16px', height: '60px', border: '1px solid ' + (isAvailable === false ? '#E50914' : isAvailable === true ? '#10B981' : 'rgba(255,255,255,0.1)'), marginBottom: '8px' }}>
            <span style={{ fontSize: '18px', color: '#A1A1AA', fontWeight: 'bold', marginRight: '4px' }}>@</span>
            <input
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#FAFAFA', fontSize: '18px', fontWeight: '500' }}
              placeholder="seu_apelido"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
            />
            {isValidating && <Loader2 size={24} color="#A1A1AA" className="spin-animation" />}
            {!isValidating && isAvailable === true && <CheckCircle2 size={24} color="#10B981" />}
            {!isValidating && isAvailable === false && <XCircle size={24} color="#E50914" />}
          </div>

          <style>
            {`
              @keyframes spin { 100% { transform: rotate(360deg); } }
              .spin-animation { animation: spin 1s linear infinite; }
            `}
          </style>

          {errorMsg && <p style={{ color: '#E50914', fontSize: '14px', marginBottom: '16px', padding: '0 8px' }}>{errorMsg}</p>}

          {suggestions.length > 0 && (
            <div style={{ marginTop: '16px', marginBottom: '24px' }}>
              <p style={{ color: '#A1A1AA', fontSize: '14px', marginBottom: '12px' }}>Sugestoes para voce:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {suggestions.map((sug) => (
                  <button
                    key={sug}
                    onClick={() => setNickname(sug)}
                    style={{ background: 'rgba(255,255,255,0.08)', padding: '10px 16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', color: '#FAFAFA', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
                  >
                    @{sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!isAvailable || isValidating || isSubmitting}
            style={{ width: '100%', background: '#E50914', height: '56px', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '16px', border: 'none', color: '#fff', fontSize: '18px', fontWeight: 'bold', cursor: (!isAvailable || isValidating || isSubmitting) ? 'not-allowed' : 'pointer', opacity: (!isAvailable || isValidating || isSubmitting) ? 0.5 : 1 }}
          >
            {isSubmitting ? 'Salvando...' : 'Confirmar e Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
}
