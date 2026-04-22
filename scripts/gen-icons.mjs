// Genera iconos PNG para el PWA usando Canvas API en Node
import { createCanvas } from 'canvas'
import { writeFileSync } from 'fs'

function drawIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  const s = size / 100

  // Fondo
  ctx.fillStyle = '#0F766E'
  ctx.roundRect(0, 0, size, size, size * 0.22)
  ctx.fill()

  // Huella - almohadilla central
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.beginPath()
  ctx.ellipse(50*s, 62*s, 18*s, 16*s, 0, 0, Math.PI*2)
  ctx.fill()

  // Dedos
  const toes = [
    { x: 32, y: 42, rx: 9, ry: 11, rot: -0.3 },
    { x: 50, y: 35, rx: 9, ry: 11, rot: 0 },
    { x: 68, y: 42, rx: 9, ry: 11, rot: 0.3 },
  ]
  toes.forEach(({ x, y, rx, ry, rot }) => {
    ctx.save()
    ctx.translate(x*s, y*s)
    ctx.rotate(rot)
    ctx.beginPath()
    ctx.ellipse(0, 0, rx*s, ry*s, 0, 0, Math.PI*2)
    ctx.fill()
    ctx.restore()
  })

  return canvas.toBuffer('image/png')
}

try {
  writeFileSync('public/icon-192.png', drawIcon(192))
  writeFileSync('public/icon-512.png', drawIcon(512))
  console.log('Icons generated.')
} catch (e) {
  console.error('canvas package not available:', e.message)
  console.log('Please install manually or use a design tool.')
}
