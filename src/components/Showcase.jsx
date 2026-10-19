import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Button, Icon, useQuote } from './ui'
import SmartImg from './SmartImg'

export default function Showcase() {
  const ref = useRef(null)
  const { open } = useQuote()
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  const inset = useTransform(p, [0, 0.45], [14, 0])
  const radius = useTransform(p, [0, 0.45], [28, 0])
  const clip = useTransform([inset, radius], ([i, r]) => `inset(${i}% ${i * 1.6}% ${i}% ${i * 1.6}% round ${r}px)`)
  const imgScale = useTransform(p, [0, 1], [1.35, 1])
  const shade = useTransform(p, [0.2, 0.55], [0.15, 0.72])

  const titleOpacity = useTransform(p, [0.3, 0.48], [0, 1])
  const titleY = useTransform(p, [0.3, 0.48], [60, 0])
  const preOpacity = useTransform(p, [0, 0.12, 0.28], [1, 1, 0])
  const preScale = useTransform(p, [0, 0.28], [1, 0.9])

  const c1 = useTransform(p, [0.52, 0.66], [0, 1])
  const c1y = useTransform(p, [0.52, 0.66], [50, 0])
  const c2 = useTransform(p, [0.6, 0.74], [0, 1])
  const c2y = useTransform(p, [0.6, 0.74], [50, 0])

  return (
    <section ref={ref} className="showcase" id="studio">
      <div className="showcase-sticky">
        <motion.div className="showcase-media" style={{ clipPath: clip }}>
          <SmartImg className="showcase-img" src="/images/shop-interior.jpg" alt="Downtown Mobile professional repair shop interior" style={{ scale: imgScale }} />
          <motion.div className="showcase-shade" style={{ opacity: shade }} />
        </motion.div>

        <motion.p className="showcase-pre" style={{ opacity: preOpacity, scale: preScale }}>
          Step inside the studio
        </motion.p>

        <div className="container showcase-copy">
          <motion.div style={{ opacity: titleOpacity, y: titleY }}>
            <p className="eyebrow">
              <span className="eyebrow-line" />
              The Studio
            </p>
            <h2 className="display-lg">
              Professional Repairs, <em>Proven Results</em>
            </h2>
            <p className="lead">
              Our modern, fully-equipped repair facility features the latest tools and technology to restore your device to like-new condition. From shattered
              screens to complex water damage, we handle every repair with precision and care.
            </p>
          </motion.div>
          <div className="showcase-cards">
            <motion.div className="glass-card" style={{ opacity: c1, y: c1y }}>
              <Icon.bolt />
              <div>
                <strong>Fast Service</strong>
                <span>30–60 minute repairs</span>
              </div>
            </motion.div>
            <motion.div className="glass-card" style={{ opacity: c2, y: c2y }}>
              <Icon.shield />
              <div>
                <strong>Quality Parts</strong>
                <span>OEM-grade components</span>
              </div>
            </motion.div>
            <motion.div style={{ opacity: c2, y: c2y }}>
              <Button onClick={() => open('schedule')} icon={<Icon.arrow />}>
                Schedule Your Repair
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
