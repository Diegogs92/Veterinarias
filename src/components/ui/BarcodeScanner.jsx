import { useEffect, useRef, useState, useCallback } from 'react'
import { X, Camera, AlertCircle, ScanLine, Flashlight, FlashlightOff } from 'lucide-react'

const BARCODE_FORMATS = [
  'ean_13', 'ean_8', 'upc_a', 'upc_e',
  'code_128', 'code_39', 'code_93',
  'itf', 'codabar', 'qr_code', 'data_matrix',
]

const hasNativeBarcodeDetector = typeof BarcodeDetector !== 'undefined'

export default function BarcodeScanner({ isOpen, onClose, onScan, title = 'Escanear código de barras' }) {
  const videoRef    = useRef(null)
  const streamRef   = useRef(null)
  const rafRef      = useRef(null)
  const activeRef   = useRef(false)

  const [error, setError]                   = useState(null)
  const [scanning, setScanning]             = useState(false)
  const [torchOn, setTorchOn]               = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)

  const stopAll = useCallback(() => {
    activeRef.current = false
    cancelAnimationFrame(rafRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setScanning(false)
    setTorchOn(false)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    activeRef.current = true
    setError(null)
    setScanning(false)

    const start = async () => {
      // 1. Pedir acceso a la cámara
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width:  { ideal: 1920 },
            height: { ideal: 1080 },
          },
        })
      } catch (e) {
        if (!activeRef.current) return
        if (e?.name === 'NotAllowedError') {
          setError('Permiso de cámara denegado. Habilitalo en la configuración del navegador.')
        } else if (e?.name === 'NotFoundError') {
          setError('No se encontró ninguna cámara en este dispositivo.')
        } else {
          setError('No se pudo iniciar la cámara. ' + (e?.message || ''))
        }
        return
      }

      if (!activeRef.current) { stream.getTracks().forEach(t => t.stop()); return }

      // 2. Conectar stream al video
      streamRef.current = stream
      const video = videoRef.current
      video.srcObject = stream
      await video.play()

      // 3. Autofocus + torch
      const track = stream.getVideoTracks()[0]
      const caps  = track.getCapabilities?.() || {}
      if (caps.focusMode?.includes('continuous')) {
        await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {})
      }
      setTorchSupported(caps.torch === true)
      setScanning(true)

      // 4. Elegir motor de detección
      if (hasNativeBarcodeDetector) {
        runNativeLoop(video)
      } else {
        runZxingLoop(video, stream)
      }
    }

    // ── Motor 1: BarcodeDetector nativo (Chrome / Android) ──
    const runNativeLoop = (video) => {
      let detector
      try {
        detector = new BarcodeDetector({ formats: BARCODE_FORMATS })
      } catch {
        // API disponible pero falló la creación → fallback
        runZxingLoop(video, streamRef.current)
        return
      }

      const loop = async () => {
        if (!activeRef.current) return
        try {
          if (video.readyState >= 2) {
            const results = await detector.detect(video)
            if (results.length > 0) {
              const code = results[0].rawValue
              if (code) { handleScan(code); return }
            }
          }
        } catch (_) {}
        rafRef.current = requestAnimationFrame(loop)
      }
      rafRef.current = requestAnimationFrame(loop)
    }

    // ── Motor 2: ZXing (fallback para Firefox / Safari) ──
    const runZxingLoop = async (video, stream) => {
      let reader
      try {
        const { BrowserMultiFormatOneDReader } = await import('@zxing/browser')
        if (!activeRef.current) return
        reader = new BrowserMultiFormatOneDReader()
        // decodeFromStream usa el stream ya existente sin crear uno nuevo
        reader.decodeFromStream(stream, video, (result, err) => {
          if (!activeRef.current) return
          if (result) handleScan(result.getText())
        })
      } catch (e) {
        if (activeRef.current) setError('No se pudo iniciar el lector. ' + (e?.message || ''))
      }
    }

    const handleScan = (code) => {
      onScan(code)
      handleClose()
    }

    start()
    return () => stopAll()
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => { stopAll(); onClose() }

  const toggleTorch = async () => {
    const stream = streamRef.current
    if (!stream) return
    const track = stream.getVideoTracks()[0]
    const next  = !torchOn
    await track.applyConstraints({ advanced: [{ torch: next }] }).catch(() => {})
    setTorchOn(next)
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) handleClose() }}
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
          <div style={{ display: 'flex', gap: 6 }}>
            {torchSupported && (
              <button
                className="btn btn--subtle btn--icon btn--sm"
                onClick={toggleTorch}
                title={torchOn ? 'Apagar linterna' : 'Encender linterna'}
              >
                {torchOn
                  ? <FlashlightOff size={16} strokeWidth={2} />
                  : <Flashlight    size={16} strokeWidth={2} />
                }
              </button>
            )}
            <button className="btn btn--subtle btn--icon btn--sm" onClick={handleClose}>
              <X size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Camera */}
        <div style={{ position: 'relative', background: '#000', aspectRatio: '4/3', overflow: 'hidden' }}>
          <video
            ref={videoRef}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            playsInline
            muted
          />

          {scanning && (
            <>
              <div style={{
                position: 'absolute', inset: 0,
                boxShadow: 'inset 0 0 0 9999px rgba(0,0,0,0.38)',
                clipPath: 'polygon(0% 0%, 0% 100%, 10% 100%, 10% 28%, 90% 28%, 90% 72%, 10% 72%, 10% 100%, 100% 100%, 100% 0%)',
                pointerEvents: 'none',
              }} />

              <div style={{
                position: 'absolute',
                top: '28%', left: '10%', right: '10%', height: '44%',
                pointerEvents: 'none',
              }}>
                {[
                  { top: -2,    left: -2,   borderTop: true,    borderLeft: true  },
                  { top: -2,    right: -2,  borderTop: true,    borderRight: true },
                  { bottom: -2, left: -2,   borderBottom: true, borderLeft: true  },
                  { bottom: -2, right: -2,  borderBottom: true, borderRight: true },
                ].map((c, i) => (
                  <div key={i} style={{
                    position: 'absolute',
                    top: c.top, bottom: c.bottom, left: c.left, right: c.right,
                    width: 24, height: 24,
                    borderTop:    c.borderTop    ? '3px solid var(--vet-teal)' : 'none',
                    borderBottom: c.borderBottom ? '3px solid var(--vet-teal)' : 'none',
                    borderLeft:   c.borderLeft   ? '3px solid var(--vet-teal)' : 'none',
                    borderRight:  c.borderRight  ? '3px solid var(--vet-teal)' : 'none',
                    borderRadius: i === 0 ? '6px 0 0 0' : i === 1 ? '0 6px 0 0' : i === 2 ? '0 0 0 6px' : '0 0 6px 0',
                  }} />
                ))}
                <div style={{
                  position: 'absolute', left: 4, right: 4, height: 2,
                  background: 'linear-gradient(90deg, transparent, var(--vet-teal), transparent)',
                  animation: 'scanLine 1.8s ease-in-out infinite',
                  boxShadow: '0 0 8px var(--vet-teal)',
                }} />
              </div>

              <div style={{
                position: 'absolute', bottom: 14, left: 0, right: 0,
                textAlign: 'center', color: 'rgba(255,255,255,0.75)', fontSize: 13,
              }}>
                Apuntá la cámara al código de barras
              </div>
            </>
          )}

          {!scanning && !error && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12,
            }}>
              <Camera size={40} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.45)' }} />
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>Iniciando cámara...</span>
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding: '14px 20px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{error}</span>
          </div>
        )}

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn--ghost" style={{ width: '100%' }} onClick={handleClose}>
            Cancelar
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          0%, 100% { top: 8%;  opacity: 0.7; }
          50%       { top: 86%; opacity: 1;   }
        }
      `}</style>
    </div>
  )
}
