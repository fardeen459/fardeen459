import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { DEVICES } from '../data'
import { Button, Eyebrow, Icon, Reveal, SplitWords, ease, useQuote } from './ui'
import { scrollTo } from '../scroll'

export default function Devices() {
  const [active, setActive] = useState(DEVICES[0].id)
  const { open } = useQuote()
  const device = DEVICES.find((d) => d.id === active)
  const DeviceIcon = Icon[device.id]

  return (
    <section className="section devices" id="services">
      <div className="container">
        <div className="section-head section-head-split">
          <div>
            <Eyebrow>Services</Eyebrow>
            <SplitWords className="display-lg" text="What device are you looking to fix?" />
          </div>
          <Reveal as="p" className="lead" delay={0.2}>
            Get a free consultation and fast repair for all your devices.
          </Reveal>
        </div>

        <div className="devices-grid">
          <Reveal className="devices-list" role="tablist" aria-label="Device categories">
            {DEVICES.map((d, i) => {
              const I = Icon[d.id]
              const on = d.id === active
              return (
                <button
                  key={d.id}
                  role="tab"
                  aria-selected={on}
                  className={`device-tab ${on ? 'is-active' : ''}`}
                  onClick={() => setActive(d.id)}
                  onMouseEnter={() => window.matchMedia('(hover: hover)').matches && setActive(d.id)}
                >
                  {on && <motion.span layoutId="device-pill" className="device-pill" transition={{ duration: 0.6, ease }} />}
                  <span className="device-index">0{i + 1}</span>
                  <I className="device-tab-icon" />
                  <span className="device-tab-text">
                    <strong>{d.name}</strong>
                    <small>{d.blurb}</small>
                  </span>
                  <Icon.arrow className="device-tab-arrow" />
                </button>
              )
            })}
          </Reveal>

          <Reveal className="device-stage" delay={0.15}>
            <div className="device-stage-bg" />
            <AnimatePresence mode="wait">
              <motion.div
                key={device.id}
                className="device-stage-inner"
                initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                transition={{ duration: 0.6, ease }}
              >
                <motion.div
                  className="device-hero-icon"
                  initial={{ rotateY: -40, scale: 0.85 }}
                  animate={{ rotateY: 0, scale: 1 }}
                  transition={{ duration: 1, ease }}
                >
                  <DeviceIcon />
                </motion.div>
                <div className="device-meta">
                  <span className="chip">
                    <Icon.clock width={14} height={14} /> Typical turnaround · {device.time}
                  </span>
                  <h3 className="display-sm">{device.name}</h3>
                  <p>{device.blurb}</p>
                  <ul className="repair-list">
                    {device.repairs.map((r, i) => (
                      <motion.li key={r} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.06, duration: 0.6, ease }}>
                        {r}
                      </motion.li>
                    ))}
                  </ul>
                  <Button onClick={() => open('quote', device.name)} icon={<Icon.arrow />}>
                    Get Free Quote
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          </Reveal>
        </div>

        <Reveal className="devices-foot">
          <p>Not sure what you need? We're here to help!</p>
          <div className="row-gap">
            <Button variant="ghost" onClick={() => open('quote')}>
              Get Free Quote
            </Button>
            <button type="button" className="link-underline" onClick={() => scrollTo('#contact')}>
              Contact Us
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
