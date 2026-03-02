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

  const authCookie = request.cookies.get('auth-token');

  // Ruta protegida sin sesión → redirigir a login
  if (isProtected && !authCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Ya autenticado intentando entrar a login/register → redirigir al dashboard
  if (isAuthRoute && authCookie) {
    return NextResponse.redirect(new URL('/companies', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
