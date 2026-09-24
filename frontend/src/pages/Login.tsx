import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Lock, User as UserIcon } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('trader');
  const [password, setPassword] = useState('capitalpilot123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ username, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-[#111622] border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-emerald-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-sky-900/40">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white font-mono">
            CAPITAL<span className="text-sky-400">PILOT</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Personal Trading Operating System • ₹15k to ₹1.35L Challenge
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Username
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                placeholder="Enter username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-sm font-bold text-white transition-all shadow-lg shadow-sky-900/30 mt-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Access Trading Console'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Demo Credentials: <span className="font-mono text-slate-300">trader / capitalpilot123</span>
        </div>

        <div className="mt-4 text-center text-xs text-slate-400">
          Need an account?{' '}
          <Link to="/register" className="text-sky-400 hover:underline font-semibold">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};
