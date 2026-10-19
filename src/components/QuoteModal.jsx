import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BUSINESS, DEVICES } from '../data'
import { Icon, ease } from './ui'

// No backend: the form composes an email to the shop with everything filled in.
export default function QuoteModal({ state, onClose }) {
  const first = useRef(null)
  const [form, setForm] = useState({})

  useEffect(() => {
    if (!state) return
    setForm({ device: state.device || DEVICES[0].name })
    const t = setTimeout(() => first.current?.focus(), 350)
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.documentElement.classList.add('modal-open')
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
      document.documentElement.classList.remove('modal-open')
    }
  }, [state, onClose])

  const schedule = state?.mode === 'schedule'
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    const subject = `${schedule ? 'Appointment request' : 'Quote request'} — ${form.device}${form.model ? ` (${form.model})` : ''}`
    const lines = [
      `Name: ${form.name || ''}`,
      `Phone: ${form.phone || ''}`,
      `Device: ${form.device || ''}`,
      `Model: ${form.model || ''}`,
      schedule ? `Preferred date/time: ${form.date || ''} ${form.time || ''}` : null,
      '',
      `Issue: ${form.issue || ''}`,
    ].filter((l) => l !== null)
    window.location.href = `mailto:${BUSINESS.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`
  }

  return (
    <AnimatePresence>
      {state && (
        <motion.div className="modal-root" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
          <div className="modal-backdrop" onClick={onClose} />
          <motion.div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            initial={{ y: 60, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.7, ease }}
            data-lenis-prevent
          >
            <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
              <Icon.close />
            </button>
            <p className="eyebrow">
              <span className="eyebrow-line" />
              {schedule ? 'Schedule Appointment' : 'Free Quote'}
            </p>
            <h3 id="modal-title" className="display-sm">
              {schedule ? 'Reserve your repair.' : 'Tell us what happened.'}
            </h3>
            <p className="modal-note">
              Walk-ins are always welcome. Prefer to talk? <a href={BUSINESS.phoneHref}>Call {BUSINESS.phone}</a>
            </p>
            <form onSubmit={submit} className="form">
              <label>
                <span>Name</span>
                <input ref={first} required value={form.name || ''} onChange={set('name')} autoComplete="name" />
              </label>
              <label>
                <span>Phone</span>
                <input required type="tel" value={form.phone || ''} onChange={set('phone')} autoComplete="tel" />
              </label>
              <label>
                <span>Device</span>
                <select value={form.device || ''} onChange={set('device')}>
                  {DEVICES.map((d) => (
                    <option key={d.id}>{d.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Model</span>
                <input placeholder="e.g. iPhone 15 Pro" value={form.model || ''} onChange={set('model')} />
              </label>
              {schedule && (
                <>
                  <label>
                    <span>Preferred date</span>
                    <input type="date" value={form.date || ''} onChange={set('date')} />
                  </label>
                  <label>
                    <span>Preferred time</span>
                    <input type="time" min="10:00" max="18:00" value={form.time || ''} onChange={set('time')} />
                  </label>
                </>
              )}
              <label className="span-2">
                <span>What needs fixing?</span>
                <textarea rows={3} value={form.issue || ''} onChange={set('issue')} placeholder="Cracked screen, battery drains fast, won't charge…" />
              </label>
              <button className="btn btn-gold span-2" type="submit">
                <span className="btn-label">{schedule ? 'Request Appointment' : 'Request Free Quote'}</span>
                <span className="btn-icon">
                  <Icon.arrow />
                </span>
              </button>
              <p className="form-fine span-2">Opens your email app with the details filled in. Mon–Fri 10–6 · Sat 10–4 · Sun closed.</p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
