import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Receipt, PiggyBank, LogOut } from 'lucide-react'

export default function SalaryLayout() {
    const { logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div data-theme="salary" className="min-h-screen bg-slate-950 text-white font-sans selection:bg-cyan-500/30">
            {/* Glassmorphism Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900/50 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col">
                <div className="mb-10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-cyan-blue" />
                    <h1 className="text-xl font-bold text-gradient-cyan-blue">
                        Budget<span className="text-white">Flow</span>
                    </h1>
                </div>

                <nav className="space-y-2 flex-1">
                    <NavLink to="/salary" icon={<LayoutDashboard size={20} />} label="Dashboard" />
                    <NavLink to="/salary/transactions" icon={<Receipt size={20} />} label="Transactions" />
                    <NavLink to="/salary/budgets" icon={<PiggyBank size={20} />} label="Budgets" />
                </nav>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all"
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </aside>

            {/* Main Content */}
            <main className="ml-64 p-8">
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
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all active:scale-95 ${isActive
                ? 'bg-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:bg-white/5 hover:text-cyan-400'
                }`}
        >
            {icon}
            <span>{label}</span>
        </Link>
    )
}
