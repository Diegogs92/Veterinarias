import { useState } from 'react'
import { Syringe, Dog, Cat, ShieldCheck, RotateCw, AlertTriangle } from 'lucide-react'
import Header from '../../components/layout/Header'

const SCHEDULE = {
  perros: [
    { age: '45 días',     vaccine: 'Vacuna A (Séxtuple/Quíntuple)', detail: 'Primera dosis. Parvovirus, Distemper, Hepatitis, Parainfluenza, Leptospirosis.', tone: 'first' },
    { age: '60 días',     vaccine: 'Vacuna A — refuerzo',           detail: 'Segunda dosis de la múltiple.',                 tone: 'first' },
    { age: '75-90 días',  vaccine: 'Vacuna A — refuerzo final',     detail: 'Tercera dosis de la múltiple.',                 tone: 'first' },
    { age: '120 días',    vaccine: 'Antirrábica',                   detail: 'Primera dosis de antirrábica (a partir de los 4 meses).', tone: 'first' },
    { age: 'Anual',       vaccine: 'Refuerzo Séxtuple + Antirrábica', detail: 'Refuerzo anual de por vida.',                 tone: 'annual' },
    { age: 'Opcional',    vaccine: 'Bordetella (tos de las perreras)', detail: 'Recomendada si frecuenta guarderías, peluquerías o paseos grupales.', tone: 'optional' },
    { age: 'Opcional',    vaccine: 'Leishmaniasis',                 detail: 'En zonas endémicas. Consultar con el veterinario.', tone: 'optional' },
  ],
  gatos: [
    { age: '60 días',     vaccine: 'Triple felina',                 detail: 'Panleucopenia, Rinotraqueítis y Calicivirus. Primera dosis.', tone: 'first' },
    { age: '90 días',     vaccine: 'Triple felina — refuerzo',      detail: 'Segunda dosis de la triple.',                   tone: 'first' },
    { age: '120 días',    vaccine: 'Antirrábica',                   detail: 'Primera dosis de antirrábica (a partir de los 4 meses).', tone: 'first' },
    { age: 'Anual',       vaccine: 'Refuerzo Triple + Antirrábica', detail: 'Refuerzo anual de por vida.',                   tone: 'annual' },
    { age: 'Opcional',    vaccine: 'Leucemia felina (FeLV)',        detail: 'Recomendada en gatos con acceso al exterior o vida con otros gatos. Dos dosis iniciales con intervalo de 3-4 semanas.', tone: 'optional' },
  ],
}

const TONE_CFG = {
  first:    { color: 'var(--accent)',    bg: 'var(--accent-3)',  Icon: ShieldCheck, label: 'Cachorro' },
  annual:   { color: 'var(--vet-emerald)', bg: 'var(--ok-3)',    Icon: RotateCw,    label: 'Refuerzo' },
  optional: { color: 'var(--warn)',      bg: 'var(--warn-3)',    Icon: AlertTriangle, label: 'Opcional' },
}

export default function VaccinesPage() {
  const [species, setSpecies] = useState('perros')
  const list = SCHEDULE[species]

  return (
    <>
      <Header
        title="Vacunas"
        subtitle="Calendario de vacunación recomendado para perros y gatos"
      />
      <div className="page">
        {/* Selector de especie */}
        <div className="tabs" style={{ marginBottom: 20, width: 'fit-content' }}>
          <button className={`tab${species === 'perros' ? ' active' : ''}`} onClick={() => setSpecies('perros')}>
            <Dog size={18} strokeWidth={2} style={{ marginRight: 6 }} />
            Perros
          </button>
          <button className={`tab${species === 'gatos' ? ' active' : ''}`} onClick={() => setSpecies('gatos')}>
            <Cat size={18} strokeWidth={2} style={{ marginRight: 6 }} />
            Gatos
          </button>
        </div>

        {/* Calendario */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {list.map((v, i) => {
            const cfg = TONE_CFG[v.tone]
            return (
              <div key={i} className="card card--no-hover" style={{ padding: 18, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 12,
                  background: cfg.bg, color: cfg.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <cfg.Icon size={26} strokeWidth={1.85} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontSize: 12, fontWeight: 700, color: cfg.color,
                      background: cfg.bg, padding: '3px 10px', borderRadius: 999,
                      textTransform: 'uppercase', letterSpacing: 0.04,
                    }}>
                      {v.age}
                    </span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{v.vaccine}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{v.detail}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Nota */}
        <div className="alert alert--info" style={{ marginTop: 24 }}>
          <Syringe size={20} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            Este calendario es una <strong>guía general</strong>. El veterinario puede ajustar el esquema según la edad,
            estado de salud y entorno de cada paciente.
          </span>
        </div>
      </div>
    </>
  )
}
