import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
 
import { Eye, EyeOff } from 'lucide-react'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const { login } = useAuth()
    const navigate = useNavigate()
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPwd, setShowPwd] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (!email.includes('@')) throw new Error('Enter a valid email')
            if (password.length < 6) throw new Error('Password too short')
            const role = await login(email, password)
            if (role === 'salary') navigate('/salary')
            else if (role === 'self_employed') navigate('/self-employed')
            else navigate('/enterprise')
        } catch (err) {
            setError(err.message || 'Invalid credentials')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto" data-testid="login-page">
            <div>
                <h2 className="text-4xl font-extrabold text-center mb-2 text-gradient" data-testid="login-title">Welcome Back</h2>
                <p className="text-center text-gray-500 mb-8" data-testid="login-subtitle">Sign in to continue to your account</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-6 text-sm flex items-center gap-3">
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span data-testid="login-error">{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" data-testid="login-form">
                <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} helper="Use your account email" className="rounded-xl" data-testid="login-email" />
                <div>
                    <Input label="Password" type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} helper="Minimum 6 characters" className="rounded-xl" data-testid="login-password" />
                    <button type="button" onClick={() => setShowPwd(v => !v)} className="text-xs text-gray-500 mt-2 flex items-center gap-1 hover:text-gray-700" data-testid="login-password-toggle">
                        {showPwd ? <EyeOff size={14} /> : <Eye size={14} />} {showPwd ? 'Hide' : 'Show'} password
                    </button>
                </div>
                <Button type="submit" disabled={loading} variant="primary" size="lg" className="w-full rounded-xl shadow-lg" data-testid="login-submit">
                    {loading ? 'Signing in...' : 'Sign In'}
                </Button>
            </form>

            <div className="mt-8 text-center" data-testid="login-footer">
                <p className="text-gray-600 text-sm">
                    Don't have an account?
                    <Link to="/register" className="ml-1 text-gradient font-bold" data-testid="login-register-link">
                        Create Account
                    </Link>
                </p>
            </div>
        </div>
    )
}
