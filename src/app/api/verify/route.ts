/**
 * 가상코드 검증 공개 API
 * GET /api/verify?code=XXXXX
 *
 * Rate limited: 20 req/min per IP
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';
import { getPublicLimiter, getClientIp, rateLimitHeaders } from '@/lib/security/rate-limit';

const logger = createLogger('api.verify');

export async function GET(request: NextRequest) {
  // Rate limiting
  const limiter = await getPublicLimiter();
  const ip = getClientIp(request);
  const rl = await limiter.limit(ip);

  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: '요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.' } },
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  const code = request.nextUrl.searchParams.get('code');

  if (!code || code.length < 4) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_CODE', message: '유효한 인증 코드를 입력해주세요.' } },
      { status: 400, headers: rateLimitHeaders(rl) },
    );
  }

  try {
    const supabase = createAdminClient();

    // 1. 가상코드 조회
    const { data: codeData, error: codeError } = await supabase
      .from('virtual_codes')
      .select('id, code, status, created_at')
      .eq('code', code.toUpperCase())
      .single();

    if (codeError || !codeData) {
      logger.info('코드 조회 실패', { code: code.slice(0, 4) + '***' });
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '인증 코드를 찾을 수 없습니다.' } },
        { status: 404, headers: rateLimitHeaders(rl) },
      );
    }

    // 2. treatment_details → treatment_records 조인으로 시술 정보 조회
    const { data: detailData } = await supabase
      .from('treatment_details')
      .select(`
        treatment_records (
          treatment_date,
          organizations:hospital_id (name)
        )
      `)
      .eq('virtual_code_id', codeData.id)
      .limit(1)
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const treatment = (detailData as any)?.treatment_records as Record<string, unknown> | null;

    const result = {
      verified: codeData.status === 'USED',
      code: codeData.code,
      status: codeData.status,
      createdAt: codeData.created_at,
      treatment: treatment
        ? {
            treatmentDate: treatment.treatment_date ?? null,
            hospitalName: (treatment.organizations as Record<string, unknown> | null)?.name ?? null,
          }
        : null,
    };

    return NextResponse.json(
      { success: true, data: result },
      { headers: rateLimitHeaders(rl) },
    );
  } catch (error) {
    logger.error('검증 API 오류', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500, headers: rateLimitHeaders(rl) },
    );
  }
}
