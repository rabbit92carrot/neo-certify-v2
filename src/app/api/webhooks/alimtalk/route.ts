/**
 * 알림톡 발송 결과 콜백 수신 웹훅
 * POST /api/webhooks/alimtalk
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';
import type { AlimtalkCallbackPayload } from './types';

const logger = createLogger('webhook.alimtalk');

export async function POST(request: NextRequest) {
  try {
    // Aligo 콜백 인증 토큰 검증
    const webhookToken = request.headers.get('x-aligo-token');
    const expectedToken = process.env.ALIGO_WEBHOOK_TOKEN;

    if (expectedToken && webhookToken !== expectedToken) {
      logger.warn('웹훅 인증 실패', { receivedToken: webhookToken?.slice(0, 8) });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as AlimtalkCallbackPayload;

    if (!body.list || !Array.isArray(body.list)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const supabase = createAdminClient();

    for (const item of body.list) {
      const isSuccess = item.result === '0';

      const updateData: Record<string, unknown> = {
        status: isSuccess ? 'SENT' : 'FAILED',
        is_sent: isSuccess,
      };

      if (isSuccess) {
        updateData['sent_at'] = item.date;
      } else {
        updateData['error_msg'] = item.message;
      }

      const { error } = await supabase
        .from('notification_messages')
        .update(updateData)
        .eq('aligo_mid', item.mid);

      if (error) {
        logger.error('웹훅 상태 업데이트 실패', { mid: item.mid, error: error.message });
      } else {
        logger.info('웹훅 상태 업데이트', {
          mid: item.mid,
          status: isSuccess ? 'SENT' : 'FAILED',
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('웹훅 처리 오류', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
