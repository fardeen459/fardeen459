import Lenis from 'lenis'

let lenis = null

export function initSmoothScroll() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}
  lenis = new Lenis({ lerp: 0.075, smoothWheel: true, wheelMultiplier: 0.9 })
  let id
  const raf = (t) => {
    lenis.raf(t)
    id = requestAnimationFrame(raf)
  }
  id = requestAnimationFrame(raf)
  return () => {
    cancelAnimationFrame(id)
    lenis.destroy()
    lenis = null
  }
}

export function scrollTo(target) {
  if (lenis) lenis.scrollTo(target, { offset: target === '#top' ? 0 : -40, duration: 1.6 })
  else document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' })
}
