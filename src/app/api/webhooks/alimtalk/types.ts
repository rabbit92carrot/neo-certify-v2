/**
 * 알림톡 웹훅 페이로드 타입
 */

export interface AlimtalkCallbackItem {
  /** Aligo 메시지 ID */
  mid: string;
  /** 개별 메시지 ID */
  msgid: string;
  /** 수신자 전화번호 */
  phone: string;
  /** 발송 결과 (0: 성공, 그 외: 실패) */
  result: string;
  /** 결과 메시지 */
  message: string;
  /** 발송 시간 */
  date: string;
}

export interface AlimtalkCallbackPayload {
  /** 콜백 결과 목록 */
  list: AlimtalkCallbackItem[];
}
