import { useEffect, useRef, useState } from 'react'
import { animate, useInView } from 'framer-motion'
import { PILLARS } from '../data'
import { Reveal } from './ui'

function Counter({ to }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!inView) return
    const c = animate(0, to, { duration: 2.2, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setVal(Math.round(v)) })
    return () => c.stop()
  }, [inView, to])
  return <span ref={ref}>{val.toLocaleString('en-US')}</span>
}

export default function Pillars() {
  return (
    <section className="pillars">
      <div className="container pillars-grid">
        {PILLARS.map((p, i) => (
          <Reveal key={p.title} className="pillar" delay={i * 0.1}>
            <div className="pillar-num">
              {/^\d+$/.test(p.k) ? <Counter to={Number(p.k)} /> : <span>{p.k}</span>}
              {p.unit && <sup>{p.unit}</sup>}
            </div>
            <h3>{p.title}</h3>
            <p>{p.text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
