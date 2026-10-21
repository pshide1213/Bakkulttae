import '@fontsource/ibm-plex-sans-kr/400.css';
import '@fontsource/ibm-plex-sans-kr/500.css';
import '@fontsource/ibm-plex-sans-kr/600.css';
import '@fontsource/ibm-plex-sans-kr/700.css';
import '@fontsource/gowun-batang/700.css';
import './globals.css';

export const metadata = {
  title: '바꿀때 — 생활용품 교체 주기 관리',
  description: '칫솔, 정수기 필터, 베개처럼 주기적으로 바꿔야 하는 물건의 교체 시기를 챙겨드려요.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#173a2f',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
