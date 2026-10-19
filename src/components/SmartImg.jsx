import { useState } from 'react'
import { motion } from 'framer-motion'

// Softens low-resolution sources so they read as atmospheric bokeh; full-res drop-ins render crisp automatically.
export default function SmartImg({ className = '', ...props }) {
  const [low, setLow] = useState(false)
  const check = (e) => setLow(e.currentTarget.naturalWidth < 1400)
  return <motion.img {...props} className={`${className} ${low ? 'img-soft' : ''}`} onLoad={check} />
}
