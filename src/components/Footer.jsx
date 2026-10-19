import { BUSINESS } from '../data'
import { useQuote } from './ui'
import { scrollTo } from '../scroll'

export default function Footer() {
  const { open } = useQuote()
  const go = (href) => (e) => {
    e.preventDefault()
    scrollTo(href)
  }
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="brand">
              <span className="brand-mark" aria-hidden="true">DM</span>
              <span className="brand-name">Downtown Mobile</span>
            </div>
            <p>Turlock's trusted phone repair experts.</p>
            <p className="muted">Fast, affordable, and reliable.</p>
          </div>
          <div>
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#services" onClick={go('#services')}>Services</a></li>
              <li><button type="button" onClick={() => open('schedule')}>Schedule Appointment</button></li>
              <li><button type="button" onClick={() => open('quote')}>Get Quote</button></li>
              <li><a href="#studio" onClick={go('#studio')}>About Us</a></li>
              <li><a href="#visit" onClick={go('#visit')}>Contact</a></li>
            </ul>
          </div>
          <div>
            <h4>Contact Us</h4>
            <ul>
              <li><a href={BUSINESS.phoneHref}>{BUSINESS.phone}</a></li>
              <li><a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a></li>
              <li>{BUSINESS.street}</li>
              <li>{BUSINESS.city}</li>
            </ul>
          </div>
          <div>
            <h4>Business Hours</h4>
            <ul className="footer-hours">
              <li><span>Mon–Fri</span>10:00 AM – 6:00 PM</li>
              <li><span>Saturday</span>10:00 AM – 4:00 PM</li>
              <li><span>Sunday</span>Closed</li>
            </ul>
          </div>
        </div>
        <div className="footer-word" aria-hidden="true">Downtown Mobile</div>
        <div className="footer-bottom">
          <p>© 2026 Downtown Mobile. All rights reserved.</p>
          <nav aria-label="Legal">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#faq" onClick={go('#faq')}>Warranty Policy</a>
          </nav>
        </div>
      </div>
    </footer>
  )
}
