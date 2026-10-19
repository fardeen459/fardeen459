import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FAQ } from '../data'
import { Eyebrow, Icon, Reveal, SplitWords, ease } from './ui'

export default function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <section className="section faq" id="faq">
      <div className="container faq-grid">
        <div>
          <Eyebrow>FAQ</Eyebrow>
          <SplitWords className="display-lg" text="Frequently Asked Questions" />
          <Reveal as="p" className="lead" delay={0.2}>
            Got questions? We've got answers.
          </Reveal>
        </div>
        <div className="faq-list">
          {FAQ.map((f, i) => {
            const on = open === i
            return (
              <Reveal key={f.q} className={`faq-item ${on ? 'is-open' : ''}`} delay={i * 0.08}>
                <button type="button" className="faq-q" aria-expanded={on} onClick={() => setOpen(on ? -1 : i)}>
                  <span>{f.q}</span>
                  <motion.span className="faq-icon" animate={{ rotate: on ? 45 : 0 }} transition={{ duration: 0.5, ease }}>
                    <Icon.plus />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.div
                      className="faq-a"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.6, ease }}
                    >
                      <p>{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
