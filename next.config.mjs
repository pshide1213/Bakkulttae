/** @type {import('next').NextConfig} */
const nextConfig = {
  // pg(PostgreSQL 드라이버)는 서버에서만 쓰므로 번들에 넣지 않습니다.
  serverExternalPackages: ['pg'],
};

export default nextConfig;
