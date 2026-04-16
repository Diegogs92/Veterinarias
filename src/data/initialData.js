import { generateId } from '../utils/helpers'

const NOW = new Date()
const d = (offsetDays, time = '00:00') => {
  const dt = new Date(NOW)
  dt.setDate(dt.getDate() + offsetDays)
  const [h, m] = time.split(':')
  dt.setHours(+h, +m, 0, 0)
  return dt.toISOString()
}
const dateStr = (offsetDays) => d(offsetDays).slice(0, 10)

export const INITIAL_USERS = [
  { id: 'u1', name: 'Dr. Carlos Médico', username: 'vet',   password: '1234', role: 'vet' },
  { id: 'u2', name: 'Ana Recepcionista',  username: 'recep', password: '1234', role: 'receptionist' },
]

export const INITIAL_OWNERS = [
  { id: 'o1', name: 'María González',  phone: '11-4532-1234', email: 'maria@email.com',   address: 'Av. Corrientes 1234, CABA',   discount: 10, createdAt: d(-60) },
  { id: 'o2', name: 'Juan Pérez',       phone: '11-2345-6789', email: 'juan@email.com',    address: 'Gral. Paz 567, Ramos Mejía',  discount: 0,  createdAt: d(-45) },
  { id: 'o3', name: 'Laura Martínez',   phone: '11-8765-4321', email: 'laura@email.com',   address: 'San Martín 890, La Plata',    discount: 0,  createdAt: d(-30) },
  { id: 'o4', name: 'Roberto Silva',    phone: '11-5555-9876', email: 'roberto@email.com', address: 'Rivadavia 321, Morón',        discount: 5,  createdAt: d(-20) },
  { id: 'o5', name: 'Claudia Torres',   phone: '11-3333-7654', email: 'claudia@email.com', address: 'Belgrano 654, Quilmes',       discount: 0,  createdAt: d(-10) },
]

const P = (id) => `https://images.unsplash.com/photo-${id}?w=400&h=400&fit=crop&auto=format&q=80`

export const INITIAL_PETS = [
  { id: 'p1', name: 'Max',   species: 'perro',  breed: 'Labrador',      birthDate: dateStr(-730),  weight: 28,  ownerId: 'o1', photo: P('1561037404-61cd46aa615b'), allergies: 'Ninguna',      observations: 'Muy activo, le gusta jugar.', createdAt: d(-60) },
  { id: 'p2', name: 'Luna',  species: 'gato',   breed: 'Siamés',        birthDate: dateStr(-1095), weight: 4,   ownerId: 'o1', photo: P('1513360371669-4adf3dd7dff8'), allergies: 'Polen',        observations: 'Esterilizada.', createdAt: d(-58) },
  { id: 'p3', name: 'Rocky', species: 'perro',  breed: 'Pastor Alemán', birthDate: dateStr(-1460), weight: 35,  ownerId: 'o2', photo: P('1589941013453-ec89f33b5e95'), allergies: 'Ninguna',      observations: 'Carácter fuerte, muy inteligente.', createdAt: d(-45) },
  { id: 'p4', name: 'Mia',   species: 'gato',   breed: 'Persa',         birthDate: dateStr(-548),  weight: 3,   ownerId: 'o3', photo: P('1533743983669-94fa5c4338ec'), allergies: 'Ninguna',      observations: '', createdAt: d(-30) },
  { id: 'p5', name: 'Toby',  species: 'perro',  breed: 'Beagle',        birthDate: dateStr(-365),  weight: 12,  ownerId: 'o4', photo: P('1537151608828-ea2b11777ee8'), allergies: 'Antibióticos', observations: 'Castrado.', createdAt: d(-20) },
  { id: 'p6', name: 'Coco',  species: 'pajaro', breed: 'Loro Hablador', birthDate: dateStr(-2190), weight: 0.3, ownerId: 'o5', photo: P('1552728089-57bdde30beb3'), allergies: 'Ninguna',      observations: 'Sabe decir 20 palabras.', createdAt: d(-10) },
]

export const INITIAL_APPOINTMENTS = [
  { id: 'a1', petId: 'p1', ownerId: 'o1', date: dateStr(0),  time: '09:00', reason: 'Control anual + vacunas',    status: 'confirmed', notes: '',                    createdAt: d(-2) },
  { id: 'a2', petId: 'p3', ownerId: 'o2', date: dateStr(0),  time: '10:30', reason: 'Revisión posoperatoria',     status: 'pending',   notes: '',                    createdAt: d(-1) },
  { id: 'a3', petId: 'p5', ownerId: 'o4', date: dateStr(0),  time: '14:00', reason: 'Consulta dermatológica',     status: 'pending',   notes: 'Trae análisis previos', createdAt: d(-1) },
  { id: 'a4', petId: 'p2', ownerId: 'o1', date: dateStr(1),  time: '11:00', reason: 'Baño y peluquería',          status: 'pending',   notes: '',                    createdAt: d(-1) },
  { id: 'a5', petId: 'p4', ownerId: 'o3', date: dateStr(2),  time: '15:30', reason: 'Control de peso trimestral', status: 'pending',   notes: '',                    createdAt: d(0) },
  { id: 'a6', petId: 'p1', ownerId: 'o1', date: dateStr(-3), time: '09:30', reason: 'Desparasitación',            status: 'attended',  notes: '',                    createdAt: d(-5) },
]

export const INITIAL_CONSULTATIONS = [
  { id: 'c1', petId: 'p1', date: d(-30), reason: 'Vómitos recurrentes',            diagnosis: 'Gastroenteritis leve',       treatment: 'Dieta blanda por 3 días',          medication: 'Metronidazol 250mg / 12hs',      observations: 'Mejora esperada en 48-72hs.',        vetId: 'u1', price: 5000, paymentStatus: 'paid',    paidAmount: 5000, createdAt: d(-30) },
  { id: 'c2', petId: 'p1', date: d(-5),  reason: 'Control post-tratamiento',       diagnosis: 'Recuperación completa',      treatment: 'Retoma dieta normal',              medication: 'Ninguna',                        observations: 'Excelente evolución.',              vetId: 'u1', price: 4500, paymentStatus: 'paid',    paidAmount: 4500, createdAt: d(-5) },
  { id: 'c3', petId: 'p3', date: d(-15), reason: 'Cojera en pata trasera izquierda', diagnosis: 'Displasia de cadera leve', treatment: 'Reposo y antiinflamatorios',        medication: 'Meloxicam 1mg/kg / 24hs por 7 días', observations: 'Recomendar control en 1 mes.', vetId: 'u1', price: 8000, paymentStatus: 'paid',    paidAmount: 8000, createdAt: d(-15) },
  { id: 'c4', petId: 'p2', date: d(-10), reason: 'Revisión anual',                 diagnosis: 'Paciente sana',              treatment: 'Ninguno',                          medication: 'Ninguna',                        observations: 'Todo en orden. Actualizar vacunas.', vetId: 'u1', price: 4500, paymentStatus: 'unpaid',  paidAmount: 0,    createdAt: d(-10) },
  { id: 'c5', petId: 'p5', date: d(-7),  reason: 'Picazón en piel',                diagnosis: 'Dermatitis alérgica',        treatment: 'Baño con shampoo medicado',         medication: 'Clorfenamina 2mg / 12hs',        observations: 'Evitar contacto con pasto.',        vetId: 'u1', price: 5500, paymentStatus: 'partial', paidAmount: 2000, createdAt: d(-7) },
]

export const INITIAL_VACCINES = [
  { id: 'v1', petId: 'p1', name: 'Sépuple (moquillo, parvovirus, etc.)', appliedDate: dateStr(-365), nextDose: dateStr(0),   notes: '', createdAt: d(-365) },
  { id: 'v2', petId: 'p1', name: 'Antirrábica',  appliedDate: dateStr(-365), nextDose: dateStr(0),   notes: '', createdAt: d(-365) },
  { id: 'v3', petId: 'p2', name: 'Triple felina', appliedDate: dateStr(-180), nextDose: dateStr(185), notes: 'Refuerzo anual', createdAt: d(-180) },
  { id: 'v4', petId: 'p3', name: 'Sépuple',       appliedDate: dateStr(-30),  nextDose: dateStr(335), notes: '', createdAt: d(-30) },
  { id: 'v5', petId: 'p3', name: 'Antirrábica',   appliedDate: dateStr(-30),  nextDose: dateStr(335), notes: '', createdAt: d(-30) },
  { id: 'v6', petId: 'p5', name: 'Sépuple',       appliedDate: dateStr(-5),   nextDose: dateStr(360), notes: 'Primera aplicación adulto', createdAt: d(-5) },
]

// ─── Catálogo ────────────────────────────────────────────────────────────────

export const INITIAL_PRODUCT_CATEGORIES = [
  { id: 'pc1', name: 'Medicamentos', createdAt: d(-90) },
  { id: 'pc2', name: 'Alimentos',    createdAt: d(-90) },
  { id: 'pc3', name: 'Accesorios',   createdAt: d(-90) },
  { id: 'pc4', name: 'Higiene',      createdAt: d(-90) },
]

export const INITIAL_PRODUCTS = [
  { id: 'pr1', name: 'Metronidazol 250mg x 20 comp', categoryId: 'pc1', price: 1800, inStock: true,  barcode: '7790001001', createdAt: d(-60) },
  { id: 'pr2', name: 'Meloxicam 1mg/kg x 10 comp',   categoryId: 'pc1', price: 2200, inStock: true,  barcode: '7790001002', createdAt: d(-60) },
  { id: 'pr3', name: 'Royal Canin Adult 3kg',         categoryId: 'pc2', price: 6500, inStock: true,  barcode: '7790001003', createdAt: d(-50) },
  { id: 'pr4', name: 'Shampoo medicado 250ml',        categoryId: 'pc4', price: 3200, inStock: true,  barcode: '7790001004', createdAt: d(-40) },
  { id: 'pr5', name: 'Collar antiparasitario',        categoryId: 'pc3', price: 2800, inStock: false, barcode: '7790001005', createdAt: d(-30) },
  { id: 'pr6', name: 'Antirrábica (dosis)',           categoryId: 'pc1', price: 1500, inStock: true,  barcode: '7790001006', createdAt: d(-20) },
]

// ─── Ventas (nueva estructura multi-producto) ─────────────────────────────────

export const INITIAL_SALES = [
  {
    id: 's1',
    ownerId: 'o1', petId: 'p1',
    items: [
      { productId: 'pr1', productName: 'Metronidazol 250mg x 20 comp', quantity: 1, unitPrice: 1800, subtotal: 1800 },
      { productId: 'pr3', productName: 'Royal Canin Adult 3kg',         quantity: 1, unitPrice: 6500, subtotal: 6500 },
    ],
    discount: 10, subtotal: 8300, total: 7470,
    paymentStatus: 'paid', paidAmount: 7470,
    date: dateStr(-30), createdAt: d(-30),
  },
  {
    id: 's2',
    ownerId: 'o2', petId: 'p3',
    items: [
      { productId: 'pr2', productName: 'Meloxicam 1mg/kg x 10 comp', quantity: 1, unitPrice: 2200, subtotal: 2200 },
    ],
    discount: 0, subtotal: 2200, total: 2200,
    paymentStatus: 'paid', paidAmount: 2200,
    date: dateStr(-15), createdAt: d(-15),
  },
  {
    id: 's3',
    ownerId: 'o1', petId: 'p2',
    items: [
      { productId: 'pr3', productName: 'Royal Canin Adult 3kg', quantity: 1, unitPrice: 6500, subtotal: 6500 },
    ],
    discount: 10, subtotal: 6500, total: 5850,
    paymentStatus: 'paid', paidAmount: 5850,
    date: dateStr(-10), createdAt: d(-10),
  },
  {
    id: 's4',
    ownerId: 'o4', petId: 'p5',
    items: [
      { productId: 'pr4', productName: 'Shampoo medicado 250ml', quantity: 1, unitPrice: 3200, subtotal: 3200 },
    ],
    discount: 5, subtotal: 3200, total: 3040,
    paymentStatus: 'unpaid', paidAmount: 0,
    date: dateStr(-7), createdAt: d(-7),
  },
]

export const INITIAL_INTERNMENTS = [
  {
    id: 'i1', petId: 'p3', ownerId: 'o2',
    admissionDate: dateStr(-3), admissionTime: '08:30',
    reason: 'Fractura de pata trasera derecha tras accidente',
    diagnosis: 'Fractura de tibia y peroné. Requiere inmovilización y monitoreo.',
    treatment: 'Inmovilización con férula. Analgesia y antibióticos preventivos.',
    medication: 'Tramadol 2mg/kg / 8hs · Amoxicilina 20mg/kg / 12hs',
    status: 'active', cage: 'Box 1', dischargeDate: null,
    dailyNotes: [
      { id: 'dn1', date: d(-3), note: 'Ingreso estable. Buena tolerancia a la anestesia. Se coloca férula.', createdAt: d(-3) },
      { id: 'dn2', date: d(-2), note: 'Primer día post-internación. Come poco pero bebe agua. Dolor controlado.', createdAt: d(-2) },
      { id: 'dn3', date: d(-1), note: 'Mejor ánimo. Tolera bien la medicación. Sin signos de infección.', createdAt: d(-1) },
    ],
    createdAt: d(-3),
  },
  {
    id: 'i2', petId: 'p1', ownerId: 'o1',
    admissionDate: dateStr(-1), admissionTime: '14:00',
    reason: 'Obstrucción intestinal parcial',
    diagnosis: 'Obstrucción intestinal por cuerpo extraño. Se observa en ecografía.',
    treatment: 'Fluidoterapia. Ayuno. Monitoreo. Evaluar necesidad de cirugía en 24hs.',
    medication: 'Suero fisiológico IV · Metoclopramida 0.5mg/kg / 8hs',
    status: 'critical', cage: 'Box 2', dischargeDate: null,
    dailyNotes: [
      { id: 'dn4', date: d(-1), note: 'Ingreso con signos de malestar severo. Se estabiliza con fluidoterapia.', createdAt: d(-1) },
    ],
    createdAt: d(-1),
  },
  {
    id: 'i3', petId: 'p4', ownerId: 'o3',
    admissionDate: dateStr(-10), admissionTime: '10:15',
    reason: 'Infección urinaria severa',
    diagnosis: 'Cistitis bacteriana con compromiso renal leve.',
    treatment: 'Antibioticoterapia EV. Fluidoterapia. Alta al mejorar parámetros.',
    medication: 'Enrofloxacina 5mg/kg / 24hs',
    status: 'discharged', cage: 'Box 3', dischargeDate: dateStr(-4),
    dailyNotes: [
      { id: 'dn5', date: d(-10), note: 'Ingreso con fiebre 40.1°C. Se inicia antibiótico EV.', createdAt: d(-10) },
      { id: 'dn6', date: d(-7),  note: 'Mejoría notable. Fiebre 38.5°C. Come bien.', createdAt: d(-7) },
      { id: 'dn7', date: d(-4),  note: 'Alta médica. Parámetros normalizados. Se envía con antibiótico oral 7 días más.', createdAt: d(-4) },
    ],
    createdAt: d(-10),
  },
]

// ─── Caja: solo egresos manuales ─────────────────────────────────────────────

export const INITIAL_CASH = [
  { id: 'cf3', type: 'expense', category: 'Insumos médicos', description: 'Compra de medicamentos al mayorista', amount: 8500,  date: dateStr(-20), createdAt: d(-20) },
  { id: 'cf4', type: 'expense', category: 'Servicios',       description: 'Servicio de luz y agua',            amount: 3200,  date: dateStr(-15), createdAt: d(-15) },
  { id: 'cf7', type: 'expense', category: 'Personal',        description: 'Honorarios asistente',              amount: 15000, date: dateStr(-1),  createdAt: d(-1) },
]

// ─── Deudas (generadas automáticamente) ──────────────────────────────────────

export const INITIAL_DEBTS = [
  // c4: Luna (o1) - revisión anual sin pagar
  { id: 'db1', ownerId: 'o1', sourceType: 'consultation', sourceId: 'c4', totalAmount: 4500, paidAmount: 0,    status: 'pending', date: dateStr(-10), createdAt: d(-10) },
  // c5: Toby (o4) - dermatitis pago parcial
  { id: 'db2', ownerId: 'o4', sourceType: 'consultation', sourceId: 'c5', totalAmount: 5500, paidAmount: 2000, status: 'partial', date: dateStr(-7),  createdAt: d(-7) },
  // s4: Toby (o4) - venta sin pagar
  { id: 'db3', ownerId: 'o4', sourceType: 'sale',         sourceId: 's4', totalAmount: 3040, paidAmount: 0,    status: 'pending', date: dateStr(-7),  createdAt: d(-7) },
]

export const INITIAL_DEBT_PAYMENTS = [
  // Pago parcial de c5
  { id: 'dp1', debtId: 'db2', ownerId: 'o4', amount: 2000, date: dateStr(-5), notes: 'Pago en efectivo', createdAt: d(-5) },
]
