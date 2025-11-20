import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Users, FileText, BarChart3, LogOut } from 'lucide-react'

export default function EnterpriseLayout() {
    const { logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div data-theme="enterprise" className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Top Navigation */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">E</div>
                            <span className="text-xl font-semibold text-gray-900">Enterprise</span>
                        </div>
                        <nav className="hidden md:flex gap-1">
                            <NavLink to="/enterprise" icon={<LayoutDashboard size={18} />} label="Overview" />
                            <NavLink to="/enterprise/clients" icon={<Users size={18} />} label="Clients" />
                            <NavLink to="/enterprise/invoices" icon={<FileText size={18} />} label="Invoices" />
                            <NavLink to="/enterprise/reports" icon={<BarChart3 size={18} />} label="Reports" />
                        </nav>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-2"
                    >
                        <LogOut size={16} />
                        Sign out
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
        >
            {icon}
            <span>{label}</span>
        </Link>
    )
}
