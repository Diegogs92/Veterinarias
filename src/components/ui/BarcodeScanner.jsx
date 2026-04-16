import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatOneDReader } from '@zxing/browser'
import { X, Camera, AlertCircle, ScanLine } from 'lucide-react'

/**
 * BarcodeScanner — modal con cámara para escanear código de barras.
 *
 * Props:
 *   isOpen    : boolean
 *   onClose   : () => void
 *   onScan    : (code: string) => void   — se llama al detectar un código
 *   title     : string (opcional)
 */
export default function BarcodeScanner({ isOpen, onClose, onScan, title = 'Escanear código de barras' }) {
  const videoRef  = useRef(null)
  const readerRef = useRef(null)
  const [error, setError]   = useState(null)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    let stopped = false
    setError(null)
    setScanning(false)

    const start = async () => {
      try {
        const reader = new BrowserMultiFormatOneDReader()
        readerRef.current = reader

        // Get available cameras
        const devices = await BrowserMultiFormatOneDReader.listVideoInputDevices()
        if (!devices || devices.length === 0) {
          setError('No se encontró ninguna cámara en este dispositivo.')
          return
        }

        // Prefer back camera
        const backCam = devices.find(d =>
          d.label.toLowerCase().includes('back') ||
          d.label.toLowerCase().includes('trasera') ||
          d.label.toLowerCase().includes('environment')
        ) || devices[devices.length - 1]

        if (stopped) return
        setScanning(true)

        await reader.decodeFromVideoDevice(
          backCam.deviceId,
          videoRef.current,
          (result, err) => {
            if (stopped) return
            if (result) {
              const code = result.getText()
              onScan(code)
              handleClose()
            }
          }
        )
      } catch (e) {
        if (!stopped) {
          if (e?.name === 'NotAllowedError') {
            setError('Permiso de cámara denegado. Permitir el acceso en el navegador e intentar de nuevo.')
          } else {
            setError('No se pudo iniciar la cámara. ' + (e?.message || ''))
          }
        }
      }
    }

    start()

    return () => {
      stopped = true
      if (readerRef.current) {
        try { BrowserMultiFormatOneDReader.releaseAllStreams() } catch (_) {}
        readerRef.current = null
      }
      setScanning(false)
    }
  }, [isOpen])

  const handleClose = () => {
    if (readerRef.current) {
      try { BrowserMultiFormatOneDReader.releaseAllStreams() } catch (_) {}
      readerRef.current = null
    }
    setScanning(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div style={{
        background: 'var(--bg-modal)', borderRadius: 'var(--r-xl)',
        width: '100%', maxWidth: 460, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 14px', borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ScanLine size={18} strokeWidth={2} style={{ color: 'var(--vet-teal)' }} />
            <span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span>
          </div>
          <button className="btn btn--subtle btn--icon btn--sm" onClick={handleClose}>
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Camera view */}
        <div style={{ position: 'relative', background: '#000', aspectRatio: '4/3', overflow: 'hidden' }}>
          <video
            ref={videoRef}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            playsInline
            muted
          />

          {/* Scanning overlay */}
          {scanning && (
            <>
              {/* Dimmed edges */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(rgba(0,0,0,0.4) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.4) 100%)',
                pointerEvents: 'none',
              }} />
              {/* Target frame */}
              <div style={{
                position: 'absolute',
                top: '30%', left: '10%', right: '10%', height: '40%',
                border: '2px solid rgba(255,255,255,0.8)',
                borderRadius: 8,
                pointerEvents: 'none',
              }}>
                {/* Corner accents */}
                {[['0%','0%'],['0%','100%'],['100%','0%'],['100%','100%']].map(([t,l], i) => (
                  <div key={i} style={{
                    position: 'absolute',
                    top: t === '0%' ? -2 : 'auto', bottom: t === '100%' ? -2 : 'auto',
                    left: l === '0%' ? -2 : 'auto', right: l === '100%' ? -2 : 'auto',
                    width: 20, height: 20,
                    borderTop: (t === '0%') ? '3px solid var(--vet-teal)' : 'none',
                    borderBottom: (t === '100%') ? '3px solid var(--vet-teal)' : 'none',
                    borderLeft: (l === '0%') ? '3px solid var(--vet-teal)' : 'none',
                    borderRight: (l === '100%') ? '3px solid var(--vet-teal)' : 'none',
                    borderRadius: (t === '0%' && l === '0%') ? '6px 0 0 0'
                      : (t === '0%' && l === '100%') ? '0 6px 0 0'
                      : (t === '100%' && l === '0%') ? '0 0 0 6px'
                      : '0 0 6px 0',
                  }} />
                ))}
                {/* Scan line animation */}
                <div style={{
                  position: 'absolute', left: 0, right: 0, height: 2,
                  background: 'var(--vet-teal)',
                  animation: 'scanLine 2s ease-in-out infinite',
                  top: '50%',
                }} />
              </div>
              <div style={{
                position: 'absolute', bottom: 16, left: 0, right: 0,
                textAlign: 'center', color: 'rgba(255,255,255,0.8)', fontSize: 13,
              }}>
                Apuntá la cámara al código de barras
              </div>
            </>
          )}

          {/* Loading state */}
          {!scanning && !error && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12,
            }}>
              <Camera size={40} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.5)' }} />
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Iniciando cámara...</span>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '14px 20px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <AlertCircle size={16} style={{ color: 'var(--vet-rose)', flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{error}</span>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn--ghost" style={{ width: '100%' }} onClick={handleClose}>
            Cancelar
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          0%, 100% { top: 5%; opacity: 0.8; }
          50% { top: 90%; opacity: 1; }
        }
      `}</style>
    </div>
  )
}
