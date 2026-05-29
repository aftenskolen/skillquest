import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const config = {
  transpilePackages: [
    "@skillquest/ui",
    "@skillquest/db",
    "@skillquest/auth",
    "@skillquest/utils"
  ],
};

export default withNextIntl(config);
