import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Float, Lightformer, RoundedBox, Sparkles } from '@react-three/drei'
import * as THREE from 'three'

const W = 1.5
const H = 3.1
const D = 0.16

const screenVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Liquid-gold wallpaper with rounded-corner mask, dynamic island and a moving sheen.
const screenFragment = /* glsl */ `
  uniform float uTime;
  uniform float uAspect;
  varying vec2 vUv;

  float sdRound(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  void main() {
    vec2 p = vUv - 0.5;
    p.x *= uAspect;
    float d = sdRound(p, vec2(0.5 * uAspect, 0.5), 0.075);
    float alpha = 1.0 - smoothstep(0.0, 0.004, d);

    float t = uTime * 0.25;
    float w1 = sin(vUv.y * 6.0 + t * 2.0 + sin(vUv.x * 4.0 - t) * 1.5) * 0.5 + 0.5;
    float w2 = sin((vUv.x + vUv.y) * 5.0 - t * 1.7) * 0.5 + 0.5;
    float glow = smoothstep(0.25, 1.0, w1 * w2);

    vec3 deep = vec3(0.012, 0.010, 0.008);
    vec3 gold = vec3(0.62, 0.42, 0.20);
    vec3 champagne = vec3(0.95, 0.78, 0.52);

    vec3 col = mix(deep, gold * 0.45, (1.0 - vUv.y) * 0.45 + glow * 0.55);
    col += champagne * pow(glow, 4.0) * 0.35;

    float orb = length((vUv - vec2(0.5, 0.40)) * vec2(uAspect, 1.0));
    col += gold * smoothstep(0.34, 0.0, orb) * 0.45;
    col += champagne * smoothstep(0.08, 0.0, orb) * 0.25;

    vec2 ip = vUv - vec2(0.5, 0.955);
    ip.x *= uAspect;
    float island = sdRound(ip, vec2(0.11, 0.017), 0.017);
    col = mix(vec3(0.0), col, smoothstep(0.0, 0.003, island));

    float sheen = smoothstep(0.035, 0.0, abs(vUv.x + vUv.y * 0.6 - mod(uTime * 0.12, 2.4) + 0.3));
    col += sheen * 0.05;

    gl_FragColor = vec4(col, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const smooth = (a, b, x) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

function Phone({ progress }) {
  const outer = useRef()
  const inner = useRef()
  const screen = useRef()
  const { viewport } = useThree()
  const wide = viewport.aspect > 1.05

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uAspect: { value: (W - 0.07) / (H - 0.07) } }),
    []
  )

  useFrame((state, dt) => {
    const p = progress.get()
    const { pointer } = state
    screen.current.uniforms.uTime.value = state.clock.elapsedTime

    const swing = smooth(0.12, 0.62, p)
    const exit = smooth(0.72, 1, p)

    const targetRotY = -0.45 + swing * Math.PI * 2 * 0.5 + exit * Math.PI + pointer.x * 0.35
    const targetRotX = 0.08 - pointer.y * 0.18 + Math.sin(swing * Math.PI) * 0.22
    const targetRotZ = (wide ? -0.08 : 0) + swing * 0.12

    const targetX = wide ? THREE.MathUtils.lerp(1.65, -1.75, swing) * Math.min(1, viewport.width / 9) : 0
    const targetY = wide ? -exit * 0.6 : THREE.MathUtils.lerp(-1.75, 1.15, swing) - exit * 0.4
    const targetS = (wide ? 1 : 0.62) * (1 - exit * 0.25)

    const r = inner.current.rotation
    r.y = THREE.MathUtils.damp(r.y, targetRotY, 3.5, dt)
    r.x = THREE.MathUtils.damp(r.x, targetRotX, 3.5, dt)
    r.z = THREE.MathUtils.damp(r.z, targetRotZ, 3.5, dt)

    const o = outer.current
    o.position.x = THREE.MathUtils.damp(o.position.x, targetX, 3, dt)
    o.position.y = THREE.MathUtils.damp(o.position.y, targetY, 3, dt)
    const s = THREE.MathUtils.damp(o.scale.x, targetS, 3, dt)
    o.scale.setScalar(s)
  })

  return (
    <group ref={outer} position={[wide ? 1.65 : 0, wide ? 0 : -1.75, 0]} scale={wide ? 1 : 0.62}>
      <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.6} floatingRange={[-0.08, 0.08]}>
        <group ref={inner} rotation={[0.08, -0.45, 0]}>
          {/* titanium frame */}
          <RoundedBox args={[W + 0.035, H + 0.035, D - 0.03]} radius={0.21} smoothness={6}>
            <meshPhysicalMaterial color="#b89466" metalness={1} roughness={0.22} clearcoat={0.6} />
          </RoundedBox>
          {/* glass body */}
          <RoundedBox args={[W, H, D]} radius={0.2} smoothness={6}>
            <meshPhysicalMaterial color="#3a3026" metalness={0.55} roughness={0.38} clearcoat={1} clearcoatRoughness={0.12} />
          </RoundedBox>
          {/* display */}
          <mesh position={[0, 0, D / 2 + 0.002]}>
            <planeGeometry args={[W - 0.07, H - 0.07]} />
            <shaderMaterial
              ref={screen}
              uniforms={uniforms}
              vertexShader={screenVertex}
              fragmentShader={screenFragment}
              transparent
            />
          </mesh>
          {/* side buttons */}
          <mesh position={[W / 2 + 0.025, 0.55, 0]}>
            <boxGeometry args={[0.02, 0.42, 0.05]} />
            <meshStandardMaterial color="#b89466" metalness={1} roughness={0.25} />
          </mesh>
          <mesh position={[-W / 2 - 0.025, 0.85, 0]}>
            <boxGeometry args={[0.02, 0.2, 0.05]} />
            <meshStandardMaterial color="#b89466" metalness={1} roughness={0.25} />
          </mesh>
          <mesh position={[-W / 2 - 0.025, 0.5, 0]}>
            <boxGeometry args={[0.02, 0.2, 0.05]} />
            <meshStandardMaterial color="#b89466" metalness={1} roughness={0.25} />
          </mesh>
          {/* camera plateau */}
          <RoundedBox args={[0.68, 0.68, 0.05]} radius={0.12} smoothness={4} position={[-0.33, 1.08, -D / 2 - 0.012]}>
            <meshPhysicalMaterial color="#221c16" metalness={0.5} roughness={0.2} clearcoat={1} />
          </RoundedBox>
          {[
            [-0.47, 1.22],
            [-0.47, 0.94],
            [-0.19, 1.08],
          ].map(([x, y], i) => (
            <group key={i} position={[x, y, -D / 2 - 0.05]} rotation={[Math.PI / 2, 0, 0]}>
              <mesh>
                <cylinderGeometry args={[0.105, 0.105, 0.05, 40]} />
                <meshStandardMaterial color="#b89466" metalness={1} roughness={0.2} />
              </mesh>
              <mesh position={[0, -0.026, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 0.01, 40]} />
                <meshPhysicalMaterial color="#05070a" metalness={0.2} roughness={0.05} clearcoat={1} />
              </mesh>
            </group>
          ))}
          {/* engraved mark on the back */}
          <mesh position={[0, -0.1, -D / 2 - 0.001]} rotation={[0, Math.PI, 0]}>
            <ringGeometry args={[0.16, 0.175, 64]} />
            <meshStandardMaterial color="#c9a96e" metalness={1} roughness={0.3} />
          </mesh>
        </group>
      </Float>
    </group>
  )
}

function Rings({ progress }) {
  const a = useRef()
  const b = useRef()
  useFrame((state, dt) => {
    const p = progress.get()
    const t = state.clock.elapsedTime
    a.current.rotation.set(1.15 + p * 0.8, t * 0.05, 0.3 + t * 0.03)
    b.current.rotation.set(1.5 - p * 0.6, -t * 0.04, -0.5)
    const s = 1 + p * 0.35
    a.current.scale.setScalar(s)
    b.current.scale.setScalar(s * 1.08)
  })
  return (
    <group>
      <mesh ref={a}>
        <torusGeometry args={[2.6, 0.006, 8, 220]} />
        <meshStandardMaterial color="#c9a96e" emissive="#8a6a3a" emissiveIntensity={0.35} transparent opacity={0.75} metalness={1} roughness={0.3} />
      </mesh>
      <mesh ref={b}>
        <torusGeometry args={[3.3, 0.004, 8, 220]} />
        <meshStandardMaterial color="#e6cfa3" emissive="#6b522c" emissiveIntensity={0.3} metalness={1} roughness={0.3} transparent opacity={0.45} />
      </mesh>
    </group>
  )
}

export default function PhoneScene({ progress, active }) {
  return (
    <Canvas
      className="hero-canvas"
      dpr={[1, 1.75]}
      frameloop={active ? 'always' : 'never'}
      camera={{ position: [0, 0, 8.2], fov: 35 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <ambientLight intensity={0.25} />
      <spotLight position={[4, 6, 6]} angle={0.4} penumbra={1} intensity={60} color="#ffe2b8" />
      <pointLight position={[-5, -2, -4]} intensity={25} color="#c9a96e" />
      <Phone progress={progress} />
      <Rings progress={progress} />
      <Sparkles count={45} scale={[11, 6, 4]} size={1.8} speed={0.25} opacity={0.55} color="#e8c98f" />
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={2.2} position={[0, 5, -2]} scale={[10, 2, 1]} color="#fff3e0" />
        <Lightformer intensity={1.6} position={[-5, 1, 1]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} color="#e8c98f" />
        <Lightformer intensity={1} position={[5, -1, 1]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} color="#ffffff" />
        <Lightformer form="ring" intensity={3} position={[2, 2, 5]} scale={1.6} color="#ffd9a0" />
      </Environment>
    </Canvas>
  )
}
