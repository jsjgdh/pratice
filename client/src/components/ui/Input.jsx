import { forwardRef } from 'react'
import clsx from 'clsx'

const base = 'input'
const variants = {
  light: 'input-light',
  dark: 'input-dark',
}

const Input = forwardRef(function Input({ label, error, helper, variant = 'light', className, ...props }, ref) {
  const cn = clsx(base, variants[variant], className)
  return (
    <div className="space-y-1">
      {label && <label className={variant === 'dark' ? 'input-label-dark' : 'input-label'}>{label}</label>}
      <input ref={ref} className={cn} {...props} />
      {helper && <div className={variant === 'dark' ? 'input-helper-dark' : 'input-helper'}>{helper}</div>}
      {error && <div className="input-error">{error}</div>}
    </div>
  )
})

export default Input