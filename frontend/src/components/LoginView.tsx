import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface LoginViewProps {
  onBack: () => void;
}

export default function LoginView({ onBack }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }
    toast.success(`Logging in as ${email}...`);
  };

  return (
    <section className="max-w-sm w-full mx-auto px-4">
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Login</h2>
          <p className="text-xs text-slate-500 mt-1.5">Access the OmniDoc smart search portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label htmlFor="email" className="text-xs font-semibold text-slate-700 block">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 bg-white"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label htmlFor="password" className="text-xs font-semibold text-slate-700 block">
              Password
            </label>
            <div className="relative flex items-center">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-3.5 pr-10 py-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-slate-400 hover:text-slate-600 focus:outline-none flex items-center justify-center cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full inline-flex items-center justify-center bg-blue-900 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-800 cursor-pointer text-xs"
            >
              Log In
            </Button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-blue-900 hover:underline cursor-pointer font-medium"
          >
            Back to landing page
          </button>
        </div>
      </div>
    </section>
  );
}
