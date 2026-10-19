import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { WHY } from '../data'
import { Eyebrow, Icon, Reveal, SplitWords } from './ui'

const ICONS = [Icon.bolt, Icon.shield, Icon.tag, Icon.home]

function TiltCard({ children, className }) {
  const ref = useRef(null)
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const rx = useSpring(useTransform(my, [0, 1], [4, -4]), { stiffness: 150, damping: 18 })
  const ry = useSpring(useTransform(mx, [0, 1], [-4, 4]), { stiffness: 150, damping: 18 })
  const glare = useTransform([mx, my], ([x, y]) => `radial-gradient(600px circle at ${x * 100}% ${y * 100}%, rgba(255,90,31,0.08), transparent 45%)`)
  const move = (e) => {
    const r = ref.current.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width)
    my.set((e.clientY - r.top) / r.height)
  }
  const leave = () => {
    mx.set(0.5)
    my.set(0.5)
  }
  return (
    <motion.article ref={ref} className={className} style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }} onMouseMove={move} onMouseLeave={leave}>
      <motion.div className="tilt-glare" style={{ background: glare }} />
      {children}
    </motion.article>
  )
}

export default function Why() {
  return (
    <section className="section why">
      <div className="container">
        <div className="section-head section-head-split">
          <div>
            <Eyebrow>Why Downtown Mobile</Eyebrow>
            <SplitWords className="display-lg" text="Why Choose Downtown Mobile?" />
          </div>
          <Reveal as="p" className="lead" delay={0.2}>
            We're Turlock's trusted phone repair experts with a commitment to quality, speed, and customer satisfaction.
          </Reveal>
        </div>
        <div className="why-grid">
          {WHY.map((w, i) => {
            const I = ICONS[i]
            return (
              <Reveal key={w.title} delay={i * 0.12}>
                <TiltCard className="why-card">
                  <div className="why-top">
                    <I className="why-icon" />
                  </div>
                  <h3>{w.title}</h3>
                  <p>{w.text}</p>
                </TiltCard>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
