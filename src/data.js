export const BUSINESS = {
  name: 'Downtown Mobile',
  phone: '(209) 585-1104',
  phoneHref: 'tel:+12095851104',
  email: 'info@downtownmobile.com',
  street: '520 E Main St',
  city: 'Turlock, CA 95380',
  mapsHref: 'https://www.google.com/maps/dir/?api=1&destination=520+E+Main+St,+Turlock,+CA+95380',
  mapsEmbed: 'https://www.google.com/maps?q=520+E+Main+St,+Turlock,+CA+95380&output=embed',
  hours: [
    ['Monday – Friday', '10:00 AM – 6:00 PM'],
    ['Saturday', '10:00 AM – 4:00 PM'],
    ['Sunday', 'Closed'],
  ],
}

export const DEVICES = [
  {
    id: 'smartphones',
    name: 'Smartphones',
    blurb: 'iPhone, Samsung, Google Pixel, and all Android devices',
    repairs: ['Screen & glass replacement', 'Battery replacement', 'Charging port repair', 'Camera & lens repair', 'Water damage recovery'],
    time: '30–60 min',
  },
  {
    id: 'tablets',
    name: 'Tablets',
    blurb: 'iPad, Samsung Galaxy Tab, and all tablet devices',
    repairs: ['Digitizer & LCD replacement', 'Battery service', 'Charging port repair', 'Button & speaker repair'],
    time: 'Same day',
  },
  {
    id: 'computers',
    name: 'Computers',
    blurb: 'Laptops, desktops, and MacBooks',
    repairs: ['Display replacement', 'Keyboard & trackpad', 'Battery replacement', 'SSD upgrades & data transfer'],
    time: 'Same day*',
  },
  {
    id: 'watches',
    name: 'Smartwatches',
    blurb: 'Apple Watch, Samsung Galaxy Watch, and more',
    repairs: ['Screen replacement', 'Battery replacement', 'Back glass & sensor repair'],
    time: 'Same day',
  },
  {
    id: 'consoles',
    name: 'Game Consoles',
    blurb: 'PlayStation, Xbox, Nintendo Switch',
    repairs: ['HDMI port repair', 'Joy-Con & controller drift', 'Overheating & fan service', 'Disc drive repair'],
    time: 'Same day*',
  },
  {
    id: 'other',
    name: 'Something Else',
    blurb: 'Other electronic devices and gadgets',
    repairs: ['Free diagnosis', 'Honest assessment', 'Transparent quote — no obligation'],
    time: 'Ask us',
  },
]

export const PILLARS = [
  { k: '✓', title: 'Certified Technicians', text: 'Expert repairs by trained professionals.' },
  { k: '90', unit: 'days', title: 'Warranty', text: 'All repairs guaranteed — parts and labor.' },
  { k: '1000', unit: '+', title: 'Repairs', text: 'Trusted by the Turlock community.' },
  { k: '30', unit: 'min', title: 'Same-Day Service', text: 'Most repairs done while you wait.' },
]

export const WHY = [
  { title: 'Fast Turnaround', text: 'Most repairs completed in 30–60 minutes. We value your time and get you back to your life quickly.' },
  { title: 'Quality Parts', text: 'We use only high-quality replacement parts that meet or exceed OEM specifications for lasting repairs.' },
  { title: 'Fair Pricing', text: 'Transparent, competitive pricing with no hidden fees. We offer price matching to ensure you get the best deal.' },
  { title: 'Local & Trusted', text: 'Family-owned business serving Turlock and the Central Valley. Your neighbors trust us with their devices.' },
]

export const STEPS = [
  { title: 'Bring In Your Device', text: 'Visit our shop or schedule an appointment online. Walk-ins always welcome!' },
  { title: 'Free Diagnosis', text: "We'll examine your device and provide a free quote with no obligation." },
  { title: 'Quick Repair', text: 'Most repairs done in 30–60 minutes. Relax in our waiting area or come back later.' },
]

export const FAQ = [
  {
    q: 'How much does repair cost?',
    a: 'Call us at (209) 585-1104 or visit us at 520 E Main St, Turlock, CA 95380 for an instant free quote. We guarantee competitive pricing and offer price matching.',
  },
  {
    q: 'How long does repair take?',
    a: 'Most repairs are completed in 30–60 minutes while you wait. Complex repairs may take longer, but we always provide an estimated timeframe upfront.',
  },
  {
    q: 'Do you have a warranty?',
    a: "Yes! All repairs come with a 90-day warranty on parts and labor. If you experience any issues with your repair, bring it back and we'll make it right.",
  },
  {
    q: 'Can I just walk in?',
    a: 'Yes, walk-ins are always welcome! You can also schedule an appointment online or by calling (209) 585-1104 to skip the wait.',
  },
]

export const GALLERY = [
  { src: 'images/before-after.jpg', alt: 'Before and after phone screen repair — Downtown Mobile Turlock', label: 'Before & After', caption: 'Shattered to flawless' },
  { src: 'images/shop-interior.jpg', alt: 'Downtown Mobile professional repair shop interior', label: 'The Studio', caption: 'Fully-equipped facility' },
  { src: 'images/technician.jpg', alt: 'Technician performing a precision board-level repair', label: 'Precision', caption: 'Board-level craftsmanship' },
  { src: 'images/phone-lineup.jpg', alt: 'Variety of iPhone models repaired at Downtown Mobile Turlock CA', label: 'Every Model', caption: 'iPhone, Samsung, Pixel & more' },
]

// Disassembly order front to back, matching the exploded 3D phone in the hero.
export const PARTS = [
  { part: 'Display assembly', fix: 'Cracked screens & dead pixels' },
  { part: 'Logic board', fix: 'Water damage & board repair' },
  { part: 'Battery', fix: 'Fast drain & swelling' },
  { part: 'Chassis', fix: 'Charging port & buttons' },
  { part: 'Back glass', fix: 'Back glass & camera lenses' },
]

// [open, close] in 24h, indexed by getDay() (0 = Sunday).
const SCHEDULE = [null, [10, 18], [10, 18], [10, 18], [10, 18], [10, 18], [10, 16]]

export function openStatus(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false })
      .formatToParts(now)
      .map((p) => [p.type, p.value])
  )
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday)
  const hour = (Number(parts.hour) % 24) + Number(parts.minute) / 60
  const fmt = (h) => `${h > 12 ? h - 12 : h} ${h >= 12 ? 'PM' : 'AM'}`
  const today = SCHEDULE[day]
  if (today && hour >= today[0] && hour < today[1]) return { open: true, label: `Open now · until ${fmt(today[1])}` }
  for (let i = today && hour < today[0] ? 0 : 1; i <= 7; i++) {
    const d = (day + i) % 7
    if (SCHEDULE[d]) {
      const when = i === 0 ? 'today' : i === 1 ? 'tomorrow' : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]
      return { open: false, label: `Closed · opens ${when} ${fmt(SCHEDULE[d][0])}` }
    }
  }
  return { open: false, label: 'Closed' }
}
