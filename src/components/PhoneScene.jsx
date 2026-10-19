import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

const W = 1.5
const H = 3.1
const D = 0.16

const smooth = (a, b, x) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// Lock screen drawn to a canvas so the UI stays crisp at any zoom.
function drawScreen(canvas) {
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height
  ctx.clearRect(0, 0, w, h)
  ctx.save()
  roundRect(ctx, 0, 0, w, h, 70)
  ctx.clip()

  const bg = ctx.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, '#dfe7ff')
  bg.addColorStop(0.55, '#f4f1ff')
  bg.addColorStop(1, '#ffe1d2')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
  for (const [x, y, r, c] of [
    [0.85, 0.2, 0.55, 'rgba(255,106,43,0.55)'],
    [0.1, 0.65, 0.6, 'rgba(70,110,255,0.45)'],
    [0.7, 0.95, 0.45, 'rgba(255,170,120,0.5)'],
  ]) {
    const g = ctx.createRadialGradient(x * w, y * h, 0, x * w, y * h, r * w)
    g.addColorStop(0, c)
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  }

  ctx.fillStyle = '#0b0d12'
  roundRect(ctx, w / 2 - 85, 26, 170, 48, 24)
  ctx.fill()

  ctx.fillStyle = '#0b0d12'
  ctx.textAlign = 'center'
  ctx.font = '500 30px "Geist", system-ui, sans-serif'
  ctx.fillText('Tuesday, Turlock', w / 2, 190)
  ctx.font = '600 170px "Bricolage Grotesque", system-ui, sans-serif'
  ctx.fillText('10:24', w / 2, 345)

  const cx = 40
  const cy = h - 330
  ctx.fillStyle = 'rgba(255,255,255,0.82)'
  roundRect(ctx, cx, cy, w - 80, 150, 36)
  ctx.fill()
  ctx.fillStyle = '#ff5a1f'
  roundRect(ctx, cx + 26, cy + 30, 64, 64, 16)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = '700 30px "Bricolage Grotesque", system-ui, sans-serif'
  ctx.fillText('DM', cx + 58, cy + 73)
  ctx.textAlign = 'left'
  ctx.fillStyle = '#0b0d12'
  ctx.font = '600 28px "Geist", system-ui, sans-serif'
  ctx.fillText('Downtown Mobile', cx + 112, cy + 58)
  ctx.fillStyle = '#4a5060'
  ctx.font = '400 26px "Geist", system-ui, sans-serif'
  ctx.fillText('Your phone is ready for pickup', cx + 112, cy + 96)
  ctx.fillStyle = '#12b76a'
  ctx.font = '500 22px "Geist Mono", monospace'
  ctx.fillText('REPAIRED · 42 MIN', cx + 112, cy + 128)

  ctx.fillStyle = 'rgba(11,13,18,0.85)'
  roundRect(ctx, w / 2 - 110, h - 46, 220, 10, 5)
  ctx.fill()
  ctx.restore()
}

function drawBattery(canvas) {
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height
  ctx.fillStyle = '#20232b'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#ff5a1f'
  ctx.fillRect(0, h * 0.12, w, 10)
  ctx.fillStyle = '#e9ebef'
  ctx.textAlign = 'center'
  ctx.font = '600 44px "Bricolage Grotesque", system-ui, sans-serif'
  ctx.fillText('Li-ion', w / 2, h * 0.42)
  ctx.font = '500 26px "Geist Mono", monospace'
  ctx.fillStyle = '#a7adba'
  ctx.fillText('3349 mAh', w / 2, h * 0.55)
  ctx.fillText('3.87 V', w / 2, h * 0.63)
}

function useCanvasTexture(draw, width, height) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = width
    c.height = height
    draw(c)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [draw, width, height])
  useEffect(() => {
    // Redraw once the web fonts are ready so the canvas uses them.
    document.fonts?.ready.then(() => {
      draw(tex.image)
      tex.needsUpdate = true
    })
  }, [draw, tex])
  return tex
}

// Thin rounded-corner plate for the glass layers; RoundedBox can't round corners wider than half its depth.
function Slab({ w, h, depth, r, children, ...props }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape()
    const x = -w / 2
    const y = -h / 2
    s.moveTo(x + r, y)
    s.lineTo(x + w - r, y)
    s.quadraticCurveTo(x + w, y, x + w, y + r)
    s.lineTo(x + w, y + h - r)
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    s.lineTo(x + r, y + h)
    s.quadraticCurveTo(x, y + h, x, y + h - r)
    s.lineTo(x, y + r)
    s.quadraticCurveTo(x, y, x + r, y)
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 12 })
    g.translate(0, 0, -depth / 2)
    return g
  }, [w, h, depth, r])
  return (
    <mesh geometry={geo} {...props}>
      {children}
    </mesh>
  )
}

const ALU = { color: '#c9ccd2', metalness: 1, roughness: 0.32 }

function Phone({ progress }) {
  const outer = useRef()
  const inner = useRef()
  const display = useRef()
  const board = useRef()
  const battery = useRef()
  const chassis = useRef()
  const back = useRef()
  const { viewport } = useThree()
  const wide = viewport.aspect > 1.05

  const screenTex = useCanvasTexture(drawScreen, 640, 1324)
  const batteryTex = useCanvasTexture(drawBattery, 256, 420)

  useFrame((state, dt) => {
    const p = progress.get()
    const { pointer } = state
    const swing = smooth(0.06, 0.42, p)
    const explode = smooth(0.18, 0.55, p)
    const exit = smooth(0.82, 1, p)

    const r = inner.current.rotation
    r.y = THREE.MathUtils.damp(r.y, -0.38 - swing * 0.72 + pointer.x * 0.22, 4, dt)
    r.x = THREE.MathUtils.damp(r.x, 0.12 + swing * 0.3 - pointer.y * 0.12, 4, dt)
    r.z = THREE.MathUtils.damp(r.z, swing * 0.12, 4, dt)

    const gap = explode * (wide ? 1 : 0.85)
    const damp = (ref, z) => (ref.current.position.z = THREE.MathUtils.damp(ref.current.position.z, z, 6, dt))
    damp(display, D / 2 + 0.012 + gap * 1.5)
    damp(board, 0.02 + gap * 0.78)
    damp(battery, -0.02 + gap * 0.1)
    damp(chassis, -gap * 0.65)
    damp(back, -D / 2 - 0.012 - gap * 1.4)

    const o = outer.current
    const tx = wide ? Math.min(2.1, viewport.width * 0.2) - swing * 0.15 : 0
    const ty = wide ? exit * 0.5 : THREE.MathUtils.lerp(-1.55, 1.3, swing) + exit * 0.3
    const ts = (wide ? 1 : 0.6) * (1 - swing * (wide ? 0.12 : 0.2))
    o.position.x = THREE.MathUtils.damp(o.position.x, tx, 3.5, dt)
    o.position.y = THREE.MathUtils.damp(o.position.y, ty + Math.sin(state.clock.elapsedTime * 0.9) * 0.05, 3.5, dt)
    o.scale.setScalar(THREE.MathUtils.damp(o.scale.x, ts, 3.5, dt))
  })

  return (
    <group ref={outer} position={[wide ? 2 : 0, wide ? 0 : -1.55, 0]} scale={wide ? 1 : 0.6}>
      <group ref={inner} rotation={[0.12, -0.38, 0]}>
        {/* display assembly */}
        <group ref={display} position={[0, 0, D / 2 + 0.012]}>
          <Slab w={W - 0.02} h={H - 0.02} depth={0.022} r={0.19}>
            <meshPhysicalMaterial color="#0b0d12" roughness={0.1} metalness={0.2} clearcoat={1} />
          </Slab>
          <mesh position={[0, 0, 0.0115]}>
            <planeGeometry args={[W - 0.08, H - 0.08]} />
            <meshBasicMaterial map={screenTex} transparent toneMapped={false} />
          </mesh>
        </group>

        {/* logic board */}
        <group ref={board} position={[0, 0, 0.02]}>
          <mesh position={[0, 0.72, 0]}>
            <boxGeometry args={[W - 0.3, 1.25, 0.03]} />
            <meshStandardMaterial color="#1f2a44" roughness={0.6} metalness={0.2} />
          </mesh>
          {[
            [-0.25, 0.95, 0.42, 0.42, '#2b2f38'],
            [0.3, 0.98, 0.3, 0.3, '#b8bcc6'],
            [0.28, 0.55, 0.36, 0.2, '#2b2f38'],
            [-0.28, 0.45, 0.3, 0.18, '#b8bcc6'],
            [0.02, 0.3, 0.6, 0.06, '#d9a441'],
          ].map(([x, y, w, h, c], i) => (
            <mesh key={i} position={[x, y, 0.03]}>
              <boxGeometry args={[w, h, 0.03]} />
              <meshStandardMaterial color={c} metalness={c === '#2b2f38' ? 0.3 : 0.9} roughness={0.35} />
            </mesh>
          ))}
        </group>

        {/* battery */}
        <group ref={battery} position={[0, 0, -0.02]}>
          <RoundedBox args={[W - 0.34, 1.55, 0.05]} radius={0.04} smoothness={3} position={[0, -0.62, 0]}>
            <meshStandardMaterial color="#20232b" roughness={0.5} />
          </RoundedBox>
          <mesh position={[0, -0.62, 0.026]}>
            <planeGeometry args={[W - 0.42, 1.48]} />
            <meshBasicMaterial map={batteryTex} toneMapped={false} />
          </mesh>
        </group>

        {/* chassis */}
        <group ref={chassis}>
          <RoundedBox args={[W, H, D]} radius={0.2} smoothness={6}>
            <meshPhysicalMaterial {...ALU} clearcoat={0.4} />
          </RoundedBox>
          <mesh position={[W / 2 + 0.012, 0.55, 0]}>
            <boxGeometry args={[0.02, 0.42, 0.05]} />
            <meshStandardMaterial {...ALU} />
          </mesh>
          <mesh position={[-W / 2 - 0.012, 0.85, 0]}>
            <boxGeometry args={[0.02, 0.2, 0.05]} />
            <meshStandardMaterial {...ALU} />
          </mesh>
          <mesh position={[-W / 2 - 0.012, 0.5, 0]}>
            <boxGeometry args={[0.02, 0.2, 0.05]} />
            <meshStandardMaterial {...ALU} />
          </mesh>
        </group>

        {/* back glass + cameras */}
        <group ref={back} position={[0, 0, -D / 2 - 0.012]}>
          <Slab w={W - 0.02} h={H - 0.02} depth={0.022} r={0.19}>
            <meshPhysicalMaterial color="#d9d5ce" roughness={0.55} metalness={0.1} clearcoat={0.3} />
          </Slab>
          <RoundedBox args={[0.66, 0.66, 0.05]} radius={0.12} smoothness={4} position={[-0.34, 1.08, -0.03]}>
            <meshPhysicalMaterial color="#cfcac2" roughness={0.3} metalness={0.2} clearcoat={1} />
          </RoundedBox>
          {[
            [-0.48, 1.22],
            [-0.48, 0.94],
            [-0.2, 1.08],
          ].map(([x, y], i) => (
            <group key={i} position={[x, y, -0.07]} rotation={[Math.PI / 2, 0, 0]}>
              <mesh>
                <cylinderGeometry args={[0.1, 0.1, 0.04, 40]} />
                <meshStandardMaterial {...ALU} />
              </mesh>
              <mesh position={[0, -0.021, 0]}>
                <cylinderGeometry args={[0.075, 0.075, 0.01, 40]} />
                <meshPhysicalMaterial color="#05070a" roughness={0.05} clearcoat={1} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  )
}

export default function PhoneScene({ progress, active }) {
  return (
    <Canvas
      className="hero-canvas"
      dpr={[1, 1.75]}
      frameloop={active ? 'always' : 'never'}
      camera={{ position: [0, 0, 8.6], fov: 35 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 6]} intensity={1.6} />
      <directionalLight position={[-6, 1, -3]} intensity={0.8} color="#ffd9c7" />
      <Phone progress={progress} />
      <ContactShadows position={[0, -2.45, 0]} opacity={0.32} scale={9} blur={2.6} far={4} resolution={512} color="#1b2030" />
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={2.5} position={[0, 5, -2]} scale={[10, 2, 1]} />
        <Lightformer intensity={1.8} position={[-5, 1, 1]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} />
        <Lightformer intensity={1.2} position={[5, -1, 1]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} color="#ffe2d4" />
        <Lightformer form="ring" intensity={2} position={[2, 2, 5]} scale={1.6} />
      </Environment>
    </Canvas>
  )
}
