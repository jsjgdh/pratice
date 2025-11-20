import { Outlet } from 'react-router-dom'

export default function AuthLayout() {

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-indigo-purple-pink relative overflow-hidden">

            {/* Glassmorphic Card */}
            <div className="w-full max-w-md p-10 space-y-6 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 relative z-10">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-indigo-pink rounded-2xl shadow-lg mb-4">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-extrabold text-gradient">
                        BudgetFlow
                    </h1>
                    <p className="text-gray-600 text-sm mt-2">Manage your finances with ease</p>
                </div>

                <Outlet />
            </div>

            {/* Decorative Elements */}
            <div className="absolute bottom-10 left-10 text-white/20 text-sm hidden md:block">
                <p>© 2024 BudgetFlow</p>
            </div>
        </div>
    )
}
