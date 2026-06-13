import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const config = {
  transpilePackages: [
    "@novolms/ui",
    "@novolms/db",
    "@novolms/auth",
    "@novolms/utils"
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.aftenskolen.no',
      },
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
};

export default withNextIntl(config);
