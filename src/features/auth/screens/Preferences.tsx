import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../services/supabase';
import { database } from '../../../services/database';
import { getGenres, getWatchProviders } from '../../../services/api';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';

export function Preferences() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [genres, setGenres] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<number[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
        return;
      }
      
      const [fetchedGenres, fetchedProviders, userPrefs] = await Promise.all([
        getGenres(),
        getWatchProviders(),
        database.getPreferences(session.user.id)
      ]);
      
      setGenres(fetchedGenres || []);
      setProviders((fetchedProviders || []).slice(0, 30));
      
      setSelectedGenres(userPrefs.genres || []);
      setSelectedProviders(userPrefs.providers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleGenre = (id: number) => {
    setSelectedGenres(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const toggleProvider = (id: number) => {
    setSelectedProviders(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const savePreferences = async () => {
    try {
      setIsSaving(true);
      await database.updatePreferences(selectedGenres, selectedProviders);
      navigate('/');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ flex: 1, minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 size={40} color="#E50914" className="spin-animation" />
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } } .spin-animation { animation: spin 1s linear infinite; }`}</style>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, minHeight: '100vh', background: 'var(--color-bg-base)', display: 'flex', flexDirection: 'column', color: '#FAFAFA' }}>
      
      <div style={{ padding: '0 16px' }}>
        <PageHeader 
          title="Preferências 🎬" 
          subtitle="Ajuste seus gêneros e streamings favoritos."
          showBackButton={true}
        />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', width: '100%', paddingBottom: '100px' }}>
        
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Generos Favoritos</h2>
        <p style={{ fontSize: '14px', color: '#A1A1AA', marginBottom: '16px', lineHeight: '20px' }}>Isso nos ajuda a personalizar seus desafios semanais e a recomendar filmes que voce realmente vai gostar.</p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {genres.map(g => {
            const isSelected = selectedGenres.includes(g.id);
            return (
              <button
                key={g.id}
                onClick={() => toggleGenre(g.id)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '24px',
                  background: isSelected ? 'rgba(229, 9, 20, 0.1)' : 'var(--color-bg-element)',
                  border: '1px solid ' + (isSelected ? '#E50914' : 'var(--color-border)'),
                  color: isSelected ? '#E50914' : '#FAFAFA',
                  fontSize: '14px',
                  fontWeight: isSelected ? 'bold' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {g.name}
              </button>
            );
          })}
        </div>

        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '32px', marginBottom: '8px' }}>Onde Assistir (Streaming)</h2>
        <p style={{ fontSize: '14px', color: '#A1A1AA', marginBottom: '16px', lineHeight: '20px' }}>Quais servicos voce assina? Vamos priorizar filmes disponiveis neles.</p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {providers.map(p => {
            const isSelected = selectedProviders.includes(p.provider_id);
            return (
              <button
                key={p.provider_id}
                onClick={() => toggleProvider(p.provider_id)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '24px',
                  background: isSelected ? 'rgba(229, 9, 20, 0.1)' : 'var(--color-bg-element)',
                  border: '1px solid ' + (isSelected ? '#E50914' : 'var(--color-border)'),
                  color: isSelected ? '#E50914' : '#FAFAFA',
                  fontSize: '14px',
                  fontWeight: isSelected ? 'bold' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {p.provider_name}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px', background: 'var(--color-bg-element)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={savePreferences}
          disabled={isSaving}
          style={{ maxWidth: '400px', width: '100%', background: '#E50914', color: '#FFF', height: '50px', borderRadius: '25px', fontSize: '16px', fontWeight: 'bold', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1 }}
        >
          {isSaving ? 'Salvando...' : 'Salvar Preferencias'}
        </button>
      </div>

    </div>
  );
}
