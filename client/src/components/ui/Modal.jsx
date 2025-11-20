import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children, dark }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className={dark ? 'modal-dark' : 'modal'}>
      <div role="dialog" aria-modal="true" className={dark ? 'modal-content-dark' : 'modal-content'}>
        {title && <h3 className={dark ? 'modal-title-dark' : 'modal-title'}>{title}</h3>}
        {children}
      </div>
    </div>
  )
}