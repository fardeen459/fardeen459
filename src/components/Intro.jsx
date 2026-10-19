import { motion } from 'framer-motion'
import { ease } from './ui'

export default function Intro() {
  return (
    <motion.div
      className="intro"
      initial={{ clipPath: 'inset(0 0 0% 0)' }}
      animate={{ clipPath: 'inset(0 0 100% 0)' }}
      transition={{ duration: 1.1, delay: 1.1, ease: [0.76, 0, 0.24, 1] }}
      aria-hidden="true"
    >
      <motion.div className="intro-mark" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease }}>
        Downtown <em>Mobile</em>
      </motion.div>
      <motion.div className="intro-bar" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1, ease }} />
    </motion.div>
  )
}
