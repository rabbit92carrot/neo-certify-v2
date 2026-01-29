/**
 * Utility functions
 */

/**
 * 시간 차이 계산 (시간 단위)
 */
export function getHoursDifference(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  return (now.getTime() - date.getTime()) / (1000 * 60 * 60);
}

/**
 * Zod 에러를 필드별 메시지 맵으로 변환
 */
export function formatZodErrors(
  error: import('zod').ZodError
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_root';
    if (!result[key]) result[key] = [];
    result[key].push(issue.message);
  }
  return result;
}

/**
 * 전화번호 마스킹
 */
export function maskPhoneNumber(phone: string): string {
  if (phone.length < 4) return '****';
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

/**
 * KST 기준 시작일 (00:00:00)
 */
export function toStartOfDayKST(dateStr: string): string {
  return `${dateStr}T00:00:00+09:00`;
}

/**
 * KST 기준 종료일 (23:59:59.999)
 */
export function toEndOfDayKST(dateStr: string): string {
  return `${dateStr}T23:59:59.999+09:00`;
}
