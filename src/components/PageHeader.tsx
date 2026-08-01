import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export function PageHeader({ title, subtitle, showBackButton = false, onBack, rightElement }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', paddingTop: '24px' }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        {showBackButton && (
          <button 
            onClick={() => onBack ? onBack() : navigate(-1)}
            style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft size={24} />
          </button>
        )}
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, lineHeight: 1.2 }}>{title}</h1>
          {subtitle && (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '18px', marginTop: '4px', margin: '4px 0 0 0' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {rightElement && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {rightElement}
        </div>
      )}
    </div>
  );
}
