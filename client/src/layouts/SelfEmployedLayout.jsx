import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Briefcase, Wallet, LogOut } from 'lucide-react'

export default function SelfEmployedLayout() {
    const { logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div data-theme="self" className="min-h-screen bg-stone-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-stone-900 text-stone-300 flex flex-col">
                <div className="p-6 border-b border-stone-800">
                    <h1 className="text-xl font-serif text-amber-500">Freelance<span className="text-white">Pro</span></h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2 mt-4">Overview</div>
                    <NavLink to="/self-employed" icon={<LayoutDashboard size={18} />} label="Dashboard" />

                    <div className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2 mt-6">Business</div>
                    <NavLink to="/self-employed/clients" icon={<Briefcase size={18} />} label="Clients & Invoices" />

                    <div className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2 mt-6">Personal</div>
                    <NavLink to="/self-employed/finances" icon={<Wallet size={18} />} label="My Finances" />
                </nav>

                <div className="p-4 border-t border-stone-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 w-full rounded hover:bg-stone-800 transition-colors"
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    )
}

function NavLink({ to, icon, label }) {
    const location = useLocation()
    const isActive = location.pathname === to

    return (
        <Link
            to={to}
            className={`flex items-center gap-3 px-4 py-2 rounded text-sm transition-colors ${isActive
                    ? 'bg-stone-800 text-amber-400'
                    : 'hover:bg-stone-800 hover:text-amber-400'
                }`}
        >
            {icon}
            <span>{label}</span>
        </Link>
    )
}
