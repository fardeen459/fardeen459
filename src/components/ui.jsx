import { createContext, useContext, useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export const ease = [0.22, 1, 0.36, 1]

export const QuoteContext = createContext({ open: () => {} })
export const useQuote = () => useContext(QuoteContext)

export function Reveal({ children, delay = 0, y = 36, className, as = 'div', ...rest }) {
  const Tag = motion[as]
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ duration: 1.1, delay, ease }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

// Line-masked word reveal for display headings.
export function SplitWords({ text, className, delay = 0, as = 'h2', immediate = false }) {
  const Tag = motion[as]
  const words = text.split(' ')
  const trigger = immediate
    ? { initial: 'hidden', animate: 'show' }
    : { initial: 'hidden', whileInView: 'show', viewport: { once: true, margin: '-10% 0px' } }
  return (
    <Tag className={className} aria-label={text} {...trigger} transition={{ staggerChildren: 0.06, delayChildren: delay }}>
      {words.map((w, i) => (
        <span className="word-mask" key={i} aria-hidden="true">
          <motion.span
            className="word"
            variants={{ hidden: { y: '110%', rotate: 4 }, show: { y: '0%', rotate: 0 } }}
            transition={{ duration: 1.1, ease }}
          >
            {w}
          </motion.span>
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </Tag>
  )
}

export function Eyebrow({ children, className = '' }) {
  return (
    <Reveal className={`eyebrow ${className}`} y={16}>
      <span className="eyebrow-line" />
      {children}
    </Reveal>
  )
}

export function Magnetic({ children, strength = 0.3, className, ...rest }) {
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 })
  const move = (e) => {
    const r = ref.current.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * strength)
    y.set((e.clientY - (r.top + r.height / 2)) * strength)
  }
  const leave = () => {
    x.set(0)
    y.set(0)
  }
  return (
    <motion.span ref={ref} className={`magnetic ${className || ''}`} style={{ x: sx, y: sy }} onMouseMove={move} onMouseLeave={leave} {...rest}>
      {children}
    </motion.span>
  )
}

export function Button({ variant = 'gold', href, onClick, children, icon, ...rest }) {
  const cls = `btn btn-${variant}`
  const inner = (
    <>
      <span className="btn-label">{children}</span>
      {icon && <span className="btn-icon">{icon}</span>}
    </>
  )
  return (
    <Magnetic strength={0.25}>
      {href ? (
        <a className={cls} href={href} onClick={onClick} {...rest}>
          {inner}
        </a>
      ) : (
        <button type="button" className={cls} onClick={onClick} {...rest}>
          {inner}
        </button>
      )}
    </Magnetic>
  )
}

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.25, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const Icon = {
  smartphones: (p) => (
    <svg viewBox="0 0 48 48" {...stroke} {...p}>
      <rect x="14" y="4" width="20" height="40" rx="4" />
      <path d="M21 8h6" />
      <path d="M22 39.5h4" />
    </svg>
  ),
  tablets: (p) => (
    <svg viewBox="0 0 48 48" {...stroke} {...p}>
      <rect x="7" y="5" width="34" height="38" rx="4" />
      <circle cx="24" cy="38.5" r="1" />
    </svg>
  ),
  computers: (p) => (
    <svg viewBox="0 0 48 48" {...stroke} {...p}>
      <rect x="8" y="9" width="32" height="22" rx="2.5" />
      <path d="M4 37h40l-3 3H7z" />
    </svg>
  ),
  watches: (p) => (
    <svg viewBox="0 0 48 48" {...stroke} {...p}>
      <rect x="13" y="13" width="22" height="22" rx="6" />
      <path d="M17 13l2-8h10l2 8M17 35l2 8h10l2-8M35 21h2" />
      <path d="M24 19v5l3 2" />
    </svg>
  ),
  consoles: (p) => (
    <svg viewBox="0 0 48 48" {...stroke} {...p}>
      <path d="M15 14h18c6 0 9 6 10 14 .8 6-1.5 9-4 9-3 0-4.5-5-8-5H17c-3.5 0-5 5-8 5-2.5 0-4.8-3-4-9 1-8 4-14 10-14z" />
      <path d="M14 21v6M11 24h6" />
      <circle cx="32" cy="22" r="1" />
      <circle cx="35" cy="26" r="1" />
    </svg>
  ),
  other: (p) => (
    <svg viewBox="0 0 48 48" {...stroke} {...p}>
      <circle cx="24" cy="24" r="17" />
      <path d="M19.5 19.5a4.5 4.5 0 1 1 6.3 4.1c-1.2.6-1.8 1.4-1.8 2.7V28" />
      <circle cx="24" cy="33" r=".8" />
    </svg>
  ),
  bolt: (p) => (
    <svg viewBox="0 0 48 48" {...stroke} {...p}>
      <path d="M27 4L10 27h13l-2 17 17-23H25z" />
    </svg>
  ),
  shield: (p) => (
    <svg viewBox="0 0 48 48" {...stroke} {...p}>
      <path d="M24 4l16 6v12c0 10-7 18-16 22C15 40 8 32 8 22V10z" />
      <path d="M17 24l5 5 9-10" />
    </svg>
  ),
  tag: (p) => (
    <svg viewBox="0 0 48 48" {...stroke} {...p}>
      <path d="M6 22V8a2 2 0 0 1 2-2h14l20 20-16 16z" />
      <circle cx="15" cy="15" r="3" />
    </svg>
  ),
  home: (p) => (
    <svg viewBox="0 0 48 48" {...stroke} {...p}>
      <path d="M6 22L24 7l18 15" />
      <path d="M11 18v23h26V18" />
      <path d="M20 41V29h8v12" />
    </svg>
  ),
  phone: (p) => (
    <svg viewBox="0 0 24 24" {...stroke} strokeWidth={1.5} {...p}>
      <path d="M5 3h3l2 5-2.5 1.5a11 11 0 0 0 7 7L16 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z" />
    </svg>
  ),
  arrow: (p) => (
    <svg viewBox="0 0 24 24" {...stroke} strokeWidth={1.5} {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  pin: (p) => (
    <svg viewBox="0 0 24 24" {...stroke} strokeWidth={1.5} {...p}>
      <path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  ),
  mail: (p) => (
    <svg viewBox="0 0 24 24" {...stroke} strokeWidth={1.5} {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  ),
  clock: (p) => (
    <svg viewBox="0 0 24 24" {...stroke} strokeWidth={1.5} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  plus: (p) => (
    <svg viewBox="0 0 24 24" {...stroke} strokeWidth={1.5} {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  close: (p) => (
    <svg viewBox="0 0 24 24" {...stroke} strokeWidth={1.5} {...p}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
}
