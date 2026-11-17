import { brand, dishes, nav, visit } from "@/config";

const eyebrow = "text-[0.64rem] font-semibold tracking-[0.26em] uppercase text-cream/50";
const display =
  "font-serif font-[350] tracking-[-0.02em] leading-[1.06] text-[clamp(2rem,4.6vw,3.6rem)] [font-variation-settings:'opsz'_144,'SOFT'_40]";

/** The page under the hero: the nav links have somewhere to go. */
export default function Sections() {
  return (
    <>
      <section id="kitchen" className="scroll-mt-8 bg-[#17110e] px-[clamp(1.25rem,3.4vw,4rem)] py-[clamp(4.5rem,11vw,9rem)]">
        <div className="mx-auto grid max-w-6xl gap-12 wide:grid-cols-[1.15fr_1fr] wide:gap-20">
          <div>
            <p className={eyebrow}>The kitchen</p>
            <h2 className={`${display} mt-5 text-balance`}>
              One table, one fire, <em className="font-[330] text-[#f0714f]">nothing behind a door.</em>
            </h2>
          </div>
          <div className="wide:pt-12">
            <p className="max-w-[34rem] text-[1.02rem] leading-[1.7] text-cream/75">
              Tavola opened in 1987 with a single round table and a grill you could lean on. The room has grown since;
              the idea has not. Everything is cooked in the open, carried to the middle of the table, and passed
              round until it is gone.
            </p>
            <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-cream/15 pt-7">
              {[
                ["1987", "The year the doors opened"],
                ["38", "Seats, all within sight of the pass"],
                ["3", "Farms, each under an hour away"],
              ].map(([figure, caption]) => (
                <div key={figure}>
                  <dt className="font-serif text-[clamp(1.7rem,3vw,2.5rem)] leading-none font-[350]">{figure}</dt>
                  <dd className="mt-2.5 text-[0.8rem] leading-snug text-cream/55">{caption}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section id="wine" className="scroll-mt-8 bg-[#1d1512] px-[clamp(1.25rem,3.4vw,4rem)] py-[clamp(4.5rem,11vw,9rem)]">
        <div className="mx-auto max-w-6xl">
          <p className={eyebrow}>Wine</p>
          <h2 className={`${display} mt-5 max-w-[20ch] text-balance`}>
            A glass for every plate, <em className="font-[330] text-[#f6b62f]">all of it Portuguese.</em>
          </h2>
          <ul className="mt-12 border-t border-cream/15">
            {dishes.map((d, i) => (
              <li
                key={d.id}
                className="grid grid-cols-[2.2rem_1fr] items-baseline gap-x-4 gap-y-1 border-b border-cream/15 py-4 wide:grid-cols-[3rem_1.1fr_1fr_11rem] wide:py-5"
              >
                <span className="text-[0.7rem] tracking-[0.2em] text-cream/40 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-serif text-[1.25rem] leading-tight font-[360]">
                  {d.name[0]} <em style={{ color: d.accent }}>{d.name[1]}</em>
                </span>
                <span className="col-start-2 text-[0.95rem] text-cream/75 wide:col-start-auto">{d.wine}</span>
                <span className="col-start-2 text-[0.7rem] tracking-[0.2em] text-cream/40 uppercase wide:col-start-auto wide:text-right">
                  {d.course}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="visit" className="scroll-mt-8 bg-[#17110e] px-[clamp(1.25rem,3.4vw,4rem)] py-[clamp(4.5rem,11vw,9rem)]">
        <div className="mx-auto grid max-w-6xl gap-12 wide:grid-cols-[1.15fr_1fr] wide:gap-20">
          <div>
            <p className={eyebrow}>Visit</p>
            <h2 className={`${display} mt-5 text-balance`}>
              Pull up a chair. <em className="font-[330] text-[#5fd0c2]">The table is already turning.</em>
            </h2>
            <a
              href={`mailto:${visit.email}?subject=A%20table%20at%20Tavola`}
              className="mt-9 inline-flex h-12 items-center gap-3 rounded-full bg-cream px-6 text-[0.66rem] font-bold tracking-[0.2em] text-[#1c1410] uppercase transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cream"
            >
              Book a table
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
                <path d="M1 5h11M8.5 1.5 12 5 8.5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
          <div className="grid gap-9 wide:pt-12">
            <div>
              <h3 className={eyebrow}>Find us</h3>
              <address className="mt-3 text-[1.02rem] leading-[1.7] text-cream/80 not-italic">
                {visit.street}
                <br />
                {visit.city}
                <br />
                <a className="underline decoration-cream/30 underline-offset-4 hover:decoration-cream" href={`mailto:${visit.email}`}>
                  {visit.email}
                </a>
              </address>
            </div>
            <div>
              <h3 className={eyebrow}>Hours</h3>
              <dl className="mt-3 border-t border-cream/15 text-[0.95rem]">
                {visit.hours.map(([day, time]) => (
                  <div key={day} className="flex items-baseline justify-between gap-6 border-b border-cream/15 py-3">
                    <dt className="text-cream/80">{day}</dt>
                    <dd className="text-right text-cream/60 tabular-nums">{time}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#100c0a] px-[clamp(1.25rem,3.4vw,4rem)] py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 wide:flex-row wide:items-center wide:justify-between">
          <div>
            <p className="font-serif text-[1.05rem] font-medium tracking-[0.34em]">{brand.name}</p>
            <p className="mt-2 text-[0.56rem] font-medium tracking-[0.3em] text-cream/50 uppercase">{brand.tagline}</p>
          </div>
          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="text-[0.66rem] font-medium tracking-[0.24em] text-cream/65 uppercase transition-colors hover:text-cream"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="max-w-[26rem] text-[0.78rem] leading-relaxed text-cream/45">
            Tavola is a fictional restaurant. Every plate on this page was drawn and lit in code, so there is no kitchen to
            call. Yet.
          </p>
        </div>
      </footer>
    </>
  );
}
