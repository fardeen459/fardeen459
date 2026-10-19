const ITEMS = ['Same-Day Service', 'Walk-Ins Welcome', '90-Day Warranty', 'Certified Technicians', 'OEM-Grade Parts', 'Free Diagnosis', 'Price Matching']

export default function Marquee() {
  const row = [...ITEMS, ...ITEMS]
  return (
    <div className="marquee" aria-label={ITEMS.join(', ')}>
      <div className="marquee-track" aria-hidden="true">
        {row.map((t, i) => (
          <span key={i}>
            {t}
            <i>✦</i>
          </span>
        ))}
      </div>
    </div>
  )
}
