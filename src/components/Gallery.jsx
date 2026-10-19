import { useLayoutEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { GALLERY } from '../data'
import SmartImg from './SmartImg'

function Card({ item, i, progress }) {
  const x = useTransform(progress, [0, 1], ['-8%', '8%'])
  return (
    <figure className={`g-card g-card-${i % 2 ? 'low' : 'high'}`}>
      <div className="g-media">
        <SmartImg className="g-img" src={item.src} alt={item.alt} style={{ x, scale: 1.2 }} loading="lazy" />
      </div>
      <figcaption>
        <span className="g-index">0{i + 1}</span>
        <strong>{item.label}</strong>
        <em>{item.caption}</em>
      </figcaption>
    </figure>
  )
}

export default function Gallery() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const track = useRef(null)
  const [distance, setDistance] = useState(0)
  useLayoutEffect(() => {
    const measure = () => setDistance(Math.max(0, track.current.scrollWidth - window.innerWidth))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(track.current)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])
  const x = useTransform(scrollYProgress, [0.05, 0.95], [0, -distance])
  const bar = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <section ref={ref} className="gallery" aria-label="Gallery">
      <div className="gallery-sticky">
        <div className="container gallery-head">
          <p className="eyebrow">
            <span className="eyebrow-line" />
            Gallery
          </p>
          <h2 className="display-lg">
            Our work, <em>up close.</em>
          </h2>
        </div>
        <motion.div ref={track} className="gallery-track" style={{ x }}>
          {GALLERY.map((g, i) => (
            <Card key={g.src} item={g} i={i} progress={scrollYProgress} />
          ))}
          <div className="g-end">
            <p>Every repair handled with precision and care.</p>
          </div>
        </motion.div>
        <div className="container">
          <div className="gallery-progress">
            <motion.span style={{ scaleX: bar }} />
          </div>
        </div>
      </div>
    </section>
  )
}
