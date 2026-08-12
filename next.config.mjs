/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // 구글 로그인 팝업(signInWithPopup)이 부모 창과 통신하려면 팝업을 허용해야 한다.
          // 이게 없으면 콘솔에 "Cross-Origin-Opener-Policy would block the window.closed call"
          // 이 뜨면서 로그인 결과를 못 받아온다.
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
        ],
      },
    ];
  },
};

export default nextConfig;
