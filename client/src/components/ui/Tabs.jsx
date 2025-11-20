import { useState } from 'react'

export default function Tabs({ tabs, initial, onChange }) {
  const [active, setActive] = useState(initial || tabs[0]?.value)
  const set = (v) => { setActive(v); onChange?.(v) }
  return (
    <div className="tabs">
      {tabs.map(t => (
        <button key={t.value} onClick={() => set(t.value)} className={`tabs-btn ${active === t.value ? 'tabs-btn-active' : ''}`}>{t.label}</button>
      ))}
    </div>
  )
}