import { useState } from 'react';
import { Film, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { useNavigate } from 'react-router-dom';

type AuthTab = 'login' | 'register';

export function AuthHome() {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (activeTab === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        navigate('/profile'); // Redireciona após login
      } else {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name }
          }
        });
        if (error) throw error;
        if (data.session) {
          navigate('/profile');
        } else {
          setErrorMsg('Cadastro realizado! Verifique seu e-mail para confirmar a conta.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/profile'
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao iniciar login com Google.');
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'url(/login-bg.jpg) center/cover no-repeat',
      position: 'relative'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}></div>

      <div className="glass-panel" style={{ 
        position: 'relative',
        zIndex: 2,
        width: '100%',
        maxWidth: '480px',
        padding: '48px',
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <img src="/icon.png" alt="Cinelândia Logo" style={{ width: '64px', height: '64px', borderRadius: '16px', objectFit: 'cover', marginBottom: '16px', boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }} />
        
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>Cinelândia</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px', textAlign: 'center' }}>
          A rede social dos cinéfilos. <br />Entre ou crie sua conta para continuar.
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', width: '100%', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px', marginBottom: '32px' }}>
          <button 
            onClick={() => { setActiveTab('login'); setErrorMsg(''); }}
            style={{ 
              flex: 1, padding: '12px', borderRadius: '8px', fontWeight: 'bold',
              background: activeTab === 'login' ? 'var(--color-bg-element)' : 'transparent',
              color: activeTab === 'login' ? 'white' : 'var(--color-text-muted)',
              transition: 'all 0.2s'
            }}
          >
            Login
          </button>
          <button 
            onClick={() => { setActiveTab('register'); setErrorMsg(''); }}
            style={{ 
              flex: 1, padding: '12px', borderRadius: '8px', fontWeight: 'bold',
              background: activeTab === 'register' ? 'var(--color-bg-element)' : 'transparent',
              color: activeTab === 'register' ? 'white' : 'var(--color-text-muted)',
              transition: 'all 0.2s'
            }}
          >
            Cadastro
          </button>
        </div>

        {errorMsg && (
          <div style={{ width: '100%', padding: '12px', background: 'rgba(229, 9, 20, 0.1)', border: '1px solid var(--color-primary)', borderRadius: '12px', color: 'var(--color-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <AlertCircle size={16} />
            {errorMsg}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleAuth} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activeTab === 'register' && (
            <div style={{ position: 'relative' }}>
              <User size={20} color="var(--color-text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Nome completo" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={activeTab === 'register'}
                style={{ width: '100%', padding: '16px 16px 16px 48px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', borderRadius: '12px', color: 'white', fontSize: '16px' }}
              />
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <Mail size={20} color="var(--color-text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="email" 
              placeholder="E-mail" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '16px 16px 16px 48px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', borderRadius: '12px', color: 'white', fontSize: '16px' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={20} color="var(--color-text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="password" 
              placeholder="Senha" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '16px 16px 16px 48px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', borderRadius: '12px', color: 'white', fontSize: '16px' }}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '16px', background: loading ? '#555' : 'var(--color-primary)', color: 'white', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', marginTop: '8px', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Processando...' : (activeTab === 'login' ? 'Entrar na Conta' : 'Criar Conta')}
          </button>
        </form>

        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '16px', margin: '32px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }}></div>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>ou continue com</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }}></div>
        </div>

        {/* Social Login */}
        <div style={{ width: '100%', display: 'flex', gap: '16px' }}>
          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: 'white', color: 'black', borderRadius: '12px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            <img src="https://cdn-icons-png.flaticon.com/512/2991/2991148.png" alt="Google" style={{ width: '20px' }} />
            Google
          </button>
        </div>
      </div>
    </div>
  );
}
