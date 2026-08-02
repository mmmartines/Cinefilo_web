import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../services/supabase';
import { PageHeader } from '../../../components/PageHeader';
import { database } from '../../../services/database';
import { ArrowLeft, LogOut, ChevronRight, User, Camera, ShieldAlert, Lock, Mail, Loader2 } from 'lucide-react';

export function SettingsHome() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userProvider, setUserProvider] = useState<string>('email');

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      
      const provider = session.user.app_metadata?.provider || 'email';
      setUserProvider(provider);
      
      let u = await database.getCurrentUser();
      if (!u) {
        // Sepe fallback if local storage doesn't have the user yet
        u = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || 'Cinéfilo',
          avatar_url: session.user.user_metadata?.avatar_url || '',
          nickname: session.user.user_metadata?.nickname || ''
        };
      }
      
      try {
        const response = await fetch('https://cinefilo-server.vercel.app/api/users', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (response.ok) {
          const apiData = await response.json();
          const remoteNickname = apiData.data?.nickname || apiData.data?.tag || apiData.nickname || apiData.tag;
          if (remoteNickname) u.nickname = remoteNickname;
          if (apiData.data?.name) u.name = apiData.data.name;
          if (apiData.data?.avatar_url) u.avatar_url = apiData.data.avatar_url;
        }
      } catch (err) {
        console.error('Erro ao buscar perfil remoto:', err);
      }
      
      await database.setCurrentUser(u);
      
      setUserProfile(u);
      setUserName(u?.name || '');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await database.logout();
    navigate('/auth');
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      if (newPassword.length > 0) {
        if (newPassword !== confirmPassword) {
          alert('As senhas não coincidem!');
          setIsSaving(false);
          return;
        }
        
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        });
        
        if (error) throw error;
        
        setNewPassword('');
        setConfirmPassword('');
        setCurrentPassword('');
      }

      if (userProfile) {
        userProfile.name = userName;
        await database.setCurrentUser(userProfile);
      }
      
      alert('Configurações salvas com sucesso!');
    } catch (e: any) {
      console.error(e);
      alert('Erro ao salvar: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETAR') return;
    try {
      await database.logout();
      navigate('/auth');
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '300px' }}>
        <Loader2 size={40} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!userProfile) return null;

  return (
    <div className="animate-fade-in" style={{ padding: '0 16px', width: '100%', paddingBottom: '100px' }}>
      <PageHeader 
        title="Configurações ⚙️" 
        subtitle="Gerencie sua conta e aplicativo."
        showBackButton={true}
        onBack={() => navigate('/profile')}
      />

      <div style={{ background: 'var(--color-bg-element)', borderRadius: '16px', padding: '24px', border: '1px solid var(--color-border)', marginBottom: '32px' }}>
        
        {/* Avatar Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--color-border)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px' }}>
             {userProfile.avatar_url ? (
               <img src={userProfile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
             ) : (
               <User size={40} color="var(--color-text-muted)" />
             )}
             {userProvider === 'google' ? (
               <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#FAFAFA', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '2px solid var(--color-bg-element)' }}>
                 <img src="https://cdn-icons-png.flaticon.com/512/2991/2991148.png" alt="Google" style={{ width: '16px', height: '16px' }} />
               </div>
             ) : (
               <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--color-primary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '2px solid var(--color-bg-element)' }}>
                 <Camera size={14} color="#FFF" />
               </div>
             )}
          </div>
          <p style={{ color: 'var(--color-primary)', fontSize: '20px', fontWeight: 'bold', letterSpacing: '1px' }}>
            @{userProfile.nickname || userProfile.id?.slice(0,6)}
          </p>
        </div>

        {/* Formulários Base */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '8px' }}>E-mail (Não pode ser alterado)</label>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-border)', borderRadius: '12px', padding: '0 16px', height: '56px', marginBottom: '16px' }}>
            <Mail color="var(--color-text-muted)" size={20} style={{ marginRight: '12px' }} />
            <input type="text" value={userProfile.email} disabled style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--color-text-muted)', fontSize: '16px', outline: 'none' }} />
          </div>

          <label style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '8px' }}>Nome Completo</label>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-bg-base)', borderRadius: '12px', padding: '0 16px', height: '56px', marginBottom: '24px', border: '1px solid var(--color-border)' }}>
            <User color="var(--color-text-muted)" size={20} style={{ marginRight: '12px' }} />
            <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', color: '#FAFAFA', fontSize: '16px', outline: 'none' }} />
          </div>

          {/* Troca de Senha */}
          {userProvider !== 'google' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '8px' }}>Nova Senha</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-bg-base)', borderRadius: '12px', padding: '0 16px', height: '56px', border: '1px solid var(--color-border)' }}>
                  <Lock color="var(--color-text-muted)" size={20} style={{ marginRight: '12px' }} />
                  <input type="password" placeholder="Deixe em branco para não alterar" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', color: '#FAFAFA', fontSize: '16px', outline: 'none' }} />
                </div>
              </div>

              {newPassword.length > 0 && (
                <div className="animate-fade-in">
                  <label style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '8px' }}>Confirmar Nova Senha</label>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-bg-base)', borderRadius: '12px', padding: '0 16px', height: '56px', border: '1px solid var(--color-border)' }}>
                    <Lock color="var(--color-text-muted)" size={20} style={{ marginRight: '12px' }} />
                    <input type="password" placeholder="Repita a nova senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', color: '#FAFAFA', fontSize: '16px', outline: 'none' }} />
                  </div>
                </div>
              )}
            </div>
          )}

          <button onClick={handleSave} disabled={isSaving} style={{ width: '100%', background: 'var(--color-primary)', color: '#FFF', height: '56px', borderRadius: '12px', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', opacity: isSaving ? 0.7 : 1 }}>
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>

        {/* Links */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Preferências do Aplicativo</h2>
          
          <div onClick={() => navigate('/preferences')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--color-bg-base)', borderRadius: '12px', cursor: 'pointer', border: '1px solid var(--color-border)' }}>
            <div>
              <p style={{ fontSize: '16px', fontWeight: 'bold' }}>Preferências de Conteúdo</p>
              <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Gêneros e Onde Assistir</p>
            </div>
            <ChevronRight size={20} color="var(--color-text-muted)" />
          </div>
        </div>

        {/* Additional Settings */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Configurações Adicionais</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--color-bg-base)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
            <div>
              <p style={{ fontSize: '16px', fontWeight: 'bold' }}>Seu @nickname</p>
              <p style={{ fontSize: '14px', color: 'var(--color-primary)', marginTop: '4px' }}>@{userProfile?.nickname || userProfile?.tag}</p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '16px' }}>Zona de Perigo</h2>
          
          <button onClick={() => setIsDeleteModalOpen(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', height: '56px', borderRadius: '12px', border: '1px solid var(--color-primary)', background: 'rgba(229, 9, 20, 0.1)', color: 'var(--color-primary)', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            <ShieldAlert size={20} />
            Deletar Minha Conta
          </button>
        </div>
      </div>

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '24px' }}>
          <div style={{ background: 'var(--color-bg-element)', padding: '32px', borderRadius: '24px', maxWidth: '400px', width: '100%', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ShieldAlert size={48} color="var(--color-primary)" style={{ marginBottom: '16px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '16px' }}>Deletar Conta</h2>
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: '24px', lineHeight: '1.5' }}>Tem certeza absoluta? Esta ação não pode ser desfeita e todo o seu histórico será perdido.</p>
            
            <label style={{ alignSelf: 'flex-start', marginBottom: '8px', fontWeight: 'bold' }}>Digite DELETAR para confirmar:</label>
            <input 
              type="text" 
              value={deleteConfirmText} 
              onChange={e => setDeleteConfirmText(e.target.value.toUpperCase())} 
              style={{ width: '100%', height: '48px', borderRadius: '12px', background: 'var(--color-border)', border: 'none', color: '#FAFAFA', textAlign: 'center', fontSize: '16px', marginBottom: '24px', outline: 'none' }}
              placeholder="DELETAR"
            />

            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button onClick={() => { setIsDeleteModalOpen(false); setDeleteConfirmText(''); }} style={{ flex: 1, height: '48px', borderRadius: '12px', background: 'var(--color-border)', color: '#FAFAFA', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button 
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETAR'}
                style={{ flex: 1, height: '48px', borderRadius: '12px', background: 'var(--color-primary)', color: '#FAFAFA', fontWeight: 'bold', border: 'none', cursor: deleteConfirmText === 'DELETAR' ? 'pointer' : 'not-allowed', opacity: deleteConfirmText === 'DELETAR' ? 1 : 0.5 }}
              >
                Sim, Deletar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
