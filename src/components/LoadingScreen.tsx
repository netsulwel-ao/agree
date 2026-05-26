import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Carregando...' }: LoadingScreenProps) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(255, 255, 255, 0.45)',
      backdropFilter: 'blur(30px)',
      zIndex: 9999,
      fontFamily: "'Poppins', sans-serif"
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20
      }}>
        <div style={{
          width: 48,
          height: 48,
          border: '4px solid rgba(15, 168, 143, 0.2)',
          borderTopColor: '#0fa88f',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
        <p style={{
          fontSize: 16,
          fontWeight: 600,
          color: '#0d1117'
        }}>
          {message}
        </p>
      </div>
    </div>
  );
}
