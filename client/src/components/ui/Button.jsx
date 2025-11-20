import { forwardRef } from 'react'
import clsx from 'clsx'

const variants = {
  primary: 'btn-primary shadow-lg',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  accent: 'btn-accent',
}

const sizes = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
}

const Button = forwardRef(function Button({ variant = 'primary', size = 'md', className, disabled, children, ...props }, ref) {
  const cn = clsx('btn', sizes[size], variants[variant], className)
  return (
    <button ref={ref} className={cn} disabled={disabled} {...props}>
      {children}
    </button>
  )
})

export default Button