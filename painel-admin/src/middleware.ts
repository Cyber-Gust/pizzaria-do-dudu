// src/middleware.ts

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Cria um cliente Supabase que pode operar no middleware.
  const supabase = createMiddlewareClient({ req, res });

  // Pega a sessão do usuário. A função refreshSession é importante
  // para manter o usuário logado.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Se o usuário NÃO estiver logado E estiver tentando acessar
  // qualquer página que não seja a de login, redireciona para /login.
  if (!session && req.nextUrl.pathname !== '/login') {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return NextResponse.redirect(redirectUrl);
  }

  // Se o usuário ESTIVER logado e tentar acessar a página de login,
  // redireciona para a página principal (dashboard).
  if (session && req.nextUrl.pathname === '/login') {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

// Configuração para dizer em quais rotas o middleware deve rodar.
// Estamos dizendo para ele rodar em todas as rotas, exceto as de
// arquivos estáticos e internas do Next.js.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
