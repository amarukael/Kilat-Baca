'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { fr } from '@/lib/styles';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

export default function QRCodeModal({ isOpen, onClose, url }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      }).catch((err) => {
        console.error('Failed to generate QR code:', err);
      });
    }
  }, [isOpen, url]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    setIsDownloading(true);
    
    canvasRef.current.toBlob((blob) => {
      if (!blob) {
        setIsDownloading(false);
        return;
      }
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'qr-code-sesi.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setIsDownloading(false);
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '24px',
          zIndex: 1001,
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ ...fr(600, '16px'), color: 'var(--text-dark)', margin: 0 }}>QR Code Sesi</h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              ...fr(400, '24px'),
              color: 'var(--text-light)',
              padding: '0 4px',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <canvas
            ref={canvasRef}
            style={{
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
          />
        </div>

        <p style={{ ...fr(400, '12px'), color: 'var(--text-light)', textAlign: 'center', marginBottom: '16px' }}>
          Siswa dapat scan QR code ini untuk mengakses sesi
        </p>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            style={{
              flex: 1,
              padding: '10px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isDownloading ? 'not-allowed' : 'pointer',
              opacity: isDownloading ? 0.6 : 1,
              ...fr(600, '13px'),
            }}
          >
            {isDownloading ? 'Mengunduh...' : 'Unduh QR Code'}
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px',
              background: 'var(--bg-light)',
              color: 'var(--text-dark)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              cursor: 'pointer',
              ...fr(600, '13px'),
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </>
  );
}
