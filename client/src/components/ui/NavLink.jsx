import { Link, useLocation } from 'react-router-dom'

export default function NavLink({ to, icon, label, activeClass, className }) {
  const location = useLocation()
  const isActive = location.pathname === to
  const base = className || 'navlink'
  const active = activeClass || 'navlink-active'
  const inactive = 'navlink-inactive'
  return (
    <Link to={to} className={`${base} ${isActive ? active : inactive}`}>
      {icon}
      <span>{label}</span>
    </Link>
  )
}