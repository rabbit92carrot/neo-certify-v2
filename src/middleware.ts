/**
 * Next.js 미들웨어
 * 인증 상태 확인 및 역할 기반 라우팅
 */
import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// 인증 없이 접근 가능한 경로
const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

// 역할별 허용 경로 매핑
const ROLE_PATH_MAP: Record<string, string> = {
  MANUFACTURER: '/manufacturer',
  DISTRIBUTOR: '/distributor',
  HOSPITAL: '/hospital',
  ADMIN: '/admin',
};

// 공개 API (미들웨어 인증 스킵, rate limiting은 라우트 자체에서 처리)
const PUBLIC_API_PATHS = ['/api/verify', '/api/inquiry', '/api/webhooks'];

// 정적 자원 등 미들웨어 스킵 패턴
const SKIP_PATHS = ['/_next', '/favicon.ico', '/api/health'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 정적 자원 스킵
  if (SKIP_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 공개 API 경로: 인증 스킵, CSP 헤더만 추가
  if (PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))) {
    const res = NextResponse.next();
    addSecurityHeaders(res);
    return res;
  }

  const { supabase, user, response } = await updateSession(request);

  // 보안 헤더 추가
  addSecurityHeaders(response);

  // 공개 경로: 로그인된 사용자는 대시보드로 리다이렉트
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    if (user) {
      const { data: org } = await supabase
        .from('organizations')
        .select('type')
        .eq('auth_user_id', user.id)
        .single();

      if (org) {
        const dashboardPath = ROLE_PATH_MAP[org.type] ?? '/';
        return NextResponse.redirect(new URL(dashboardPath, request.url));
      }
    }
    return response;
  }

  // 보호된 경로: 미인증 사용자는 로그인으로 리다이렉트
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 역할 기반 라우팅 검증
  const dashboardMatch = pathname.match(/^\/(manufacturer|distributor|hospital|admin)/);
  if (dashboardMatch) {
    const requestedRole = dashboardMatch[1]!.toUpperCase();

    const { data: org } = await supabase
      .from('organizations')
      .select('type, status')
      .eq('auth_user_id', user.id)
      .single();

    if (!org) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // 비활성 계정
    if (org.status !== 'ACTIVE') {
      return NextResponse.redirect(new URL('/login?error=inactive', request.url));
    }

    // 역할 불일치
    if (org.type !== requestedRole) {
      const correctPath = ROLE_PATH_MAP[org.type] ?? '/';
      return NextResponse.redirect(new URL(correctPath, request.url));
    }
  }

  return response;
}

// ============================================================================
// 보안 헤더
// ============================================================================

function addSecurityHeaders(response: NextResponse): void {
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-eval in dev
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co https://kakaoapi.aligo.in",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
