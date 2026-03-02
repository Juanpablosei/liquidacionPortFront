'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { registerSchema, type RegisterFormData } from '@/lib/validators/auth';
import { register as registerApi } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/auth-store';
import { ApiRequestError } from '@/lib/api/client';
import { ROUTES } from '@/lib/constants/routes';

export default function RegisterPage() {
  const router = useRouter();
  const loginStore = useAuthStore((s) => s.login);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterFormData) {
    setIsLoading(true);
    try {
      const payload = {
        email:    data.email,
        password: data.password,
        ...(data.name ? { name: data.name } : {}),
      };
      const res = await registerApi(payload);
      loginStore(res.user, res.accessToken, res.refreshToken);
      toast.success('¡Cuenta creada exitosamente!');
      router.push(ROUTES.companies);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.status === 409) {
          toast.error('El email ya está registrado');
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error('Ocurrió un error inesperado');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ animation: 'fadeUp 0.5s ease both' }}>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white mb-1.5">
          Crear cuenta
        </h1>
        <p className="text-sm text-slate-400">
          Completá tus datos para comenzar gratis
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

        {/* Nombre */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-slate-300">
            Nombre <span className="text-slate-600 font-normal">(opcional)</span>
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Tu nombre completo"
            className="h-11 w-full rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-slate-600 px-4 text-sm outline-none transition-all focus:border-[#2563EB] focus:bg-white/[0.08] focus:ring-2 focus:ring-[#2563EB]/20"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-xs text-red-400">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-slate-300">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            className="h-11 w-full rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-slate-600 px-4 text-sm outline-none transition-all focus:border-[#2563EB] focus:bg-white/[0.08] focus:ring-2 focus:ring-[#2563EB]/20"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-slate-300">
            Contraseña <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className="h-11 w-full rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-slate-600 px-4 pr-11 text-sm outline-none transition-all focus:border-[#2563EB] focus:bg-white/[0.08] focus:ring-2 focus:ring-[#2563EB]/20"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password ? (
            <p className="text-xs text-red-400">{errors.password.message}</p>
          ) : (
            <p className="text-xs text-slate-600">
              Mínimo 8 caracteres, una mayúscula, una minúscula y un número
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-1 h-11 w-full rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium transition-all hover:shadow-[0_0_24px_rgba(37,99,235,0.4)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creando cuenta...
            </>
          ) : (
            'Crear cuenta gratis'
          )}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-white/[0.07]" />
        <span className="text-xs text-slate-600">o</span>
        <div className="flex-1 h-px bg-white/[0.07]" />
      </div>

      <p className="text-center text-sm text-slate-500">
        ¿Ya tenés cuenta?{' '}
        <Link
          href={ROUTES.login}
          className="text-[#2563EB] hover:text-[#93BBFC] font-medium transition-colors"
        >
          Iniciar sesión
        </Link>
      </p>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
