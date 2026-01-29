import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Neo-Certify v2',
  description: '의료기기 정품 인증 시스템',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
