/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 本番ビルドでESLintエラーがあっても落とさない
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
