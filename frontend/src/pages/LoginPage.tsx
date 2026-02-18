import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TrendingUp, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Input, Button } from '@/components/ui';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError('');
    try {
      await login(data.email, data.password);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setServerError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left panel - visual */}
      <div className="hidden lg:flex flex-1 bg-surface-1 border-r border-surface-3 flex-col justify-between p-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center">
            <TrendingUp size={18} className="text-surface font-bold" />
          </div>
          <span className="font-display text-xl font-semibold text-text-primary">FinTrack</span>
        </div>

        <div className="space-y-6">
          <div className="text-5xl font-display font-bold text-text-primary leading-tight">
            Take control of your
            <span className="text-accent block">finances</span>
          </div>
          <p className="text-text-secondary text-lg">
            Track expenses, set budgets, and reach your financial goals with clarity.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { label: 'Transactions', value: '100K+' },
              { label: 'Users', value: '12K+' },
              { label: 'Saved', value: '$2M+' },
            ].map((stat) => (
              <div key={stat.label} className="card p-4">
                <p className="text-2xl font-display font-bold text-accent">{stat.value}</p>
                <p className="text-text-secondary text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-text-muted text-xs">© 2025 FinTrack. Built for your financial clarity.</p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[380px] space-y-8 animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center">
              <TrendingUp size={18} className="text-surface" />
            </div>
            <span className="font-display text-xl font-semibold text-text-primary">FinTrack</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-display font-bold text-text-primary">Welcome back</h1>
            <p className="text-text-secondary text-sm">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail size={15} />}
              error={errors.email?.message}
              {...register('email')}
            />

            <div>
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  leftIcon={<Lock size={15} />}
                  error={errors.password?.message}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-[34px] text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {serverError && (
              <div className="bg-danger/10 border border-danger/20 rounded-xl p-3">
                <p className="text-danger text-sm">{serverError}</p>
              </div>
            )}

            <Button type="submit" loading={isSubmitting} className="w-full mt-2">
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm text-text-secondary">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent hover:underline font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
