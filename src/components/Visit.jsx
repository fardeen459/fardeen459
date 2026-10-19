import { BUSINESS } from '../data'
import { Button, Eyebrow, Icon, Reveal, SplitWords } from './ui'

export default function Visit() {
  return (
    <section className="section visit" id="visit">
      <div className="container visit-grid">
        <div className="visit-copy">
          <Eyebrow>Visit Us</Eyebrow>
          <SplitWords className="display-lg" text="Visit Our Turlock Location" />
          <Reveal className="visit-card" delay={0.15}>
            <div className="visit-row">
              <Icon.pin />
              <div>
                <strong>{BUSINESS.street}</strong>
                <span>{BUSINESS.city}</span>
              </div>
            </div>
            <div className="visit-row">
              <Icon.clock />
              <dl className="hours">
                {BUSINESS.hours.map(([d, h]) => (
                  <div key={d}>
                    <dt>{d}</dt>
                    <dd className={h === 'Closed' ? 'muted' : ''}>{h}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="visit-row">
              <Icon.phone />
              <a href={BUSINESS.phoneHref}>{BUSINESS.phone}</a>
            </div>
            <div className="row-gap">
              <Button href={BUSINESS.mapsHref} target="_blank" rel="noreferrer" icon={<Icon.arrow />}>
                Get Directions
              </Button>
            </div>
          </Reveal>
        </div>
        <Reveal className="map-frame" delay={0.25}>
          <iframe title="Map to Downtown Mobile, 520 E Main St, Turlock" src={BUSINESS.mapsEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          <div className="map-pin">
            <span />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
