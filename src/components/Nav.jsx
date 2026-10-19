import { useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { BUSINESS } from '../data'
import { Icon, ease, useQuote } from './ui'
import { scrollTo } from '../scroll'

const LINKS = [
  ['Services', '#services'],
  ['Studio', '#studio'],
  ['Process', '#process'],
  ['Visit', '#visit'],
  ['FAQ', '#faq'],
]

export default function Nav() {
  const { scrollY } = useScroll()
  const [solid, setSolid] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [menu, setMenu] = useState(false)
  const { open } = useQuote()

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0
    setSolid(y > 40)
    setHidden(y > prev && y > 600 && !menu)
  })

  const go = (e, href) => {
    e.preventDefault()
    setMenu(false)
    scrollTo(href)
  }

  return (
    <>
      <motion.header
        className={`nav ${solid ? 'nav-solid' : ''}`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: hidden ? -100 : 0, opacity: 1 }}
        transition={{ duration: 0.8, ease, delay: hidden ? 0 : 0.2 }}
      >
        <div className="container nav-inner">
          <a href="#top" className="brand" onClick={(e) => go(e, '#top')}>
            <span className="brand-mark">DM</span>
            <span className="brand-name">
              Downtown <em>Mobile</em>
            </span>
          </a>
          <nav className="nav-links" aria-label="Primary">
            {LINKS.map(([label, href]) => (
              <a key={href} href={href} onClick={(e) => go(e, href)}>
                {label}
              </a>
            ))}
          </nav>
          <div className="nav-actions">
            <a className="nav-phone" href={BUSINESS.phoneHref}>
              <Icon.phone width={16} height={16} />
              {BUSINESS.phone}
            </a>
            <button type="button" className="btn btn-gold btn-sm" onClick={() => open('schedule')}>
              <span className="btn-label">Book</span>
            </button>
            <button type="button" className={`burger ${menu ? 'is-open' : ''}`} aria-label="Menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
              <span />
              <span />
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {menu && (
          <motion.div
            className="mobile-menu"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.7, ease }}
          >
            <nav>
              {LINKS.map(([label, href], i) => (
                <motion.a
                  key={href}
                  href={href}
                  onClick={(e) => go(e, href)}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.06, duration: 0.7, ease }}
                >
                  {label}
                </motion.a>
              ))}
            </nav>
            <a className="mobile-menu-phone" href={BUSINESS.phoneHref}>
              Call {BUSINESS.phone}
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
