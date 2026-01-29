/**
 * 이력 조회 공개 API
 * GET /api/inquiry?phone=01012345678&code=XXXXX
 *
 * Rate limited: 20 req/min per IP
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';
import { getPublicLimiter, getClientIp, rateLimitHeaders } from '@/lib/security/rate-limit';

const logger = createLogger('api.inquiry');

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

  const phone = request.nextUrl.searchParams.get('phone');
  const code = request.nextUrl.searchParams.get('code');

  if (!phone && !code) {
    return NextResponse.json(
      { success: false, error: { code: 'MISSING_PARAMS', message: '전화번호 또는 인증코드를 입력해주세요.' } },
      { status: 400, headers: rateLimitHeaders(rl) },
    );
  }

  try {
    const supabase = createAdminClient();

    // 코드 기반 조회
    if (code) {
      const { data: codeData } = await supabase
        .from('virtual_codes')
        .select('id, code, status, created_at')
        .eq('code', code.toUpperCase())
        .single();

      if (!codeData) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: '해당 코드의 이력을 찾을 수 없습니다.' } },
          { status: 404, headers: rateLimitHeaders(rl) },
        );
      }

      // treatment_details를 통해 시술 정보 조회
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

      return NextResponse.json(
        {
          success: true,
          data: {
            records: [{
              code: codeData.code,
              status: codeData.status,
              createdAt: codeData.created_at,
              treatmentDate: treatment?.treatment_date ?? null,
              hospitalName: (treatment?.organizations as Record<string, unknown> | null)?.name ?? null,
            }],
          },
        },
        { headers: rateLimitHeaders(rl) },
      );
    }

    // 전화번호 기반 조회
    if (phone) {
      const normalized = phone.replace(/[^0-9]/g, '');
      if (normalized.length < 10) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_PHONE', message: '유효한 전화번호를 입력해주세요.' } },
          { status: 400, headers: rateLimitHeaders(rl) },
        );
      }

      const { data, error } = await supabase
        .from('treatment_records')
        .select(`
          id,
          treatment_date,
          organizations:hospital_id (name),
          treatment_details (
            virtual_codes (code, status)
          )
        `)
        .eq('patient_phone', normalized)
        .order('treatment_date', { ascending: false })
        .limit(20);

      if (error) {
        logger.error('이력 조회 오류', { error: error.message });
        return NextResponse.json(
          { success: false, error: { code: 'QUERY_ERROR', message: '조회 중 오류가 발생했습니다.' } },
          { status: 500, headers: rateLimitHeaders(rl) },
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const records = (data ?? []).map((t: any) => {
        const details = Array.isArray(t.treatment_details) ? t.treatment_details : [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const firstCode = details.length > 0 ? (details[0] as any)?.virtual_codes : null;
        return {
          treatmentDate: t.treatment_date,
          hospitalName: t.organizations?.name ?? null,
          code: firstCode?.code ?? null,
          status: firstCode?.status ?? null,
        };
      });

      return NextResponse.json(
        { success: true, data: { records } },
        { headers: rateLimitHeaders(rl) },
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '잘못된 요청입니다.' } },
      { status: 400, headers: rateLimitHeaders(rl) },
    );
  } catch (error) {
    logger.error('이력 조회 API 오류', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500, headers: rateLimitHeaders(rl) },
    );
  }
}
