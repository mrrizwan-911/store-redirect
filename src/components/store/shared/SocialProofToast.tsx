'use client'

import { useEffect, useRef, useState } from 'react'

// ── Data pools ───────────────────────────────────────────────────────────────

const PK_CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Faisalabad', 'Rawalpindi', 'Multan', 'Peshawar', 'Sialkot']
const UK_CITIES = ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Edinburgh', 'Bristol']
const GLOBAL_CITIES = ['Dubai', 'New York', 'Toronto', 'Sydney', 'Melbourne']

const PRODUCTS = [
  'Embroidered Lawn Kurta',
  'Printed Chiffon Dupatta Set',
  'Luxury Pret Suit',
  'Formal Embroidered 3-Piece',
  'Unstitched Festive Collection',
  'Designer Silk Kurti',
  'Embellished Formal Gown',
  'Casual Cotton Co-ord Set',
  'Premium Lawn Collection',
]

const MESSAGES = [
  (city: string, product: string) => `Someone from ${city} just ordered ${product}`,
  (city: string, _: string) => `${city} 🛍 Just placed an order`,
  (_: string, product: string) => `${product} is trending right now`,
  (city: string, product: string) => `A customer in ${city} is buying ${product}`,
]

const SOLD_MESSAGES = [
  (n: number) => `🔥 ${n} sold in the last hour`,
  (n: number) => `${n} orders placed today`,
  (n: number) => `${n} people bought this today`,
]

const LOCAL_KEY = 'calnza_sp_counter'
const INTERVAL_MS = 32000 // ~32s between toasts
const INITIAL_DELAY = 6000  // 6s before first toast

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCounter(): number {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) return parseInt(raw, 10)
    const start = Math.floor(Math.random() * 8) + 4 // 4–11
    localStorage.setItem(LOCAL_KEY, String(start))
    return start
  } catch {
    return 7
  }
}

function incrementCounter(): number {
  try {
    const next = getCounter() + Math.floor(Math.random() * 2) + 1 // +1 or +2
    localStorage.setItem(LOCAL_KEY, String(next))
    return next
  } catch {
    return getCounter() + 1
  }
}

function getCities(): string[] {
  try {
    const country = document.cookie.match(/calnza_region=([^;]+)/)?.[1] || 'PK'
    if (country === 'UK') return UK_CITIES
    if (country === 'GLOBAL') return GLOBAL_CITIES
    return PK_CITIES
  } catch {
    return PK_CITIES
  }
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

interface ToastData {
  text: string
  icon: string
}

function buildToast(counter: number): ToastData {
  const cities = getCities()
  const city = randomFrom(cities)
  const product = randomFrom(PRODUCTS)

  // 40% chance show sold count, 60% show city order
  if (Math.random() < 0.4) {
    const template = randomFrom(SOLD_MESSAGES)
    return { text: template(counter), icon: '🔥' }
  }

  const template = randomFrom(MESSAGES)
  return { text: template(city, product), icon: '🛍️' }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SocialProofToast() {
  const [visible, setVisible] = useState(false)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [leaving, setLeaving] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showNext() {
    const counter = incrementCounter()
    const data = buildToast(counter)
    setToast(data)
    setLeaving(false)
    setVisible(true)

    // Auto-dismiss after 5s
    timerRef.current = setTimeout(() => {
      dismiss()
    }, 5000)
  }

  function dismiss() {
    setLeaving(true)
    setTimeout(() => {
      setVisible(false)
      setLeaving(false)
    }, 400)
  }

  useEffect(() => {
    // Initial delay before first toast
    const initial = setTimeout(() => {
      showNext()

      // Then cycle every INTERVAL_MS
      const cycle = setInterval(showNext, INTERVAL_MS)
      return () => clearInterval(cycle)
    }, INITIAL_DELAY)

    return () => {
      clearTimeout(initial)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!visible || !toast) return null

  return (
    <div
      className={`social-proof-toast ${leaving ? 'sp-leaving' : 'sp-entering'}`}
      onClick={dismiss}
      role="status"
      aria-live="polite"
    >
      <span className="sp-icon">{toast.icon}</span>
      <span className="sp-text">{toast.text}</span>
      <button className="sp-close" aria-label="Dismiss">&times;</button>

      <style>{`
        .social-proof-toast {
          position: fixed;
          bottom: 24px;
          left: 20px;
          z-index: 9999;
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(0, 0, 0, 0.07);
          border-radius: 12px;
          padding: 12px 14px 12px 16px;
          max-width: 290px;
          box-shadow:
            0 8px 32px rgba(0,0,0,0.12),
            0 2px 8px rgba(0,0,0,0.06);
          cursor: pointer;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .sp-entering {
          animation: sp-slide-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .sp-leaving {
          animation: sp-slide-out 0.35s cubic-bezier(0.4, 0, 1, 1) both;
        }
        @keyframes sp-slide-in {
          from { opacity: 0; transform: translateY(12px) translateX(-8px); }
          to   { opacity: 1; transform: translateY(0) translateX(0); }
        }
        @keyframes sp-slide-out {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(10px); }
        }
        .sp-icon {
          font-size: 1.15rem;
          flex-shrink: 0;
          line-height: 1;
        }
        .sp-text {
          font-size: 0.78rem;
          color: #1a1a1a;
          line-height: 1.35;
          flex: 1;
          font-weight: 400;
          letter-spacing: 0.005em;
        }
        .sp-close {
          background: none;
          border: none;
          color: #aaa;
          font-size: 1rem;
          cursor: pointer;
          padding: 0 0 0 4px;
          line-height: 1;
          flex-shrink: 0;
        }
        .sp-close:hover { color: #555; }

        /* Green pulse dot */
        .social-proof-toast::before {
          content: '';
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
          flex-shrink: 0;
          animation: sp-pulse 2s infinite;
          order: -1;
        }
        @keyframes sp-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.75); }
        }

        @media (max-width: 480px) {
          .social-proof-toast {
            bottom: 80px; /* above mobile nav bar */
            left: 12px;
            right: 12px;
            max-width: none;
          }
        }
      `}</style>
    </div>
  )
}
