import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas que requieren autenticación (solo dashboard)
const PROTECTED_PREFIXES = ['/companies', '/profile'];

// Rutas de auth que redirigen al dashboard si ya está autenticado
const AUTH_ROUTES = ['/login', '/register'];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((r) => pathname.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname === r);
  const isChangePwd = pathname === '/change-password';

  const authCookie     = request.cookies.get('auth-token');
  const mustChangePwd  = request.cookies.get('must-change-pwd');

  // Ruta protegida sin sesión → redirigir a login
  if ((isProtected || isChangePwd) && !authCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Tiene mustChangePassword → forzar a /change-password (bloquear dashboard)
  if (isProtected && authCookie && mustChangePwd) {
    return NextResponse.redirect(new URL('/change-password', request.url));
  }

  // Ya cambió la contraseña, no dejar en /change-password
  if (isChangePwd && authCookie && !mustChangePwd) {
    return NextResponse.redirect(new URL('/companies', request.url));
  }

  // Ya autenticado intentando entrar a login/register → redirigir al dashboard
  if (isAuthRoute && authCookie) {
    if (mustChangePwd) {
      return NextResponse.redirect(new URL('/change-password', request.url));
    }
    return NextResponse.redirect(new URL('/companies', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
