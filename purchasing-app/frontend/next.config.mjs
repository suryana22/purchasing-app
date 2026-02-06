/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/master-data/:path*',
                destination: 'http://master-data-service:4001/api/:path*',
            },
            {
                source: '/api/purchasing/:path*',
                destination: 'http://purchasing-service:4002/api/:path*',
            },
            {
                source: '/api/tracking/:path*',
                destination: 'http://tracking-service:4003/api/:path*',
            },
        ];
    },
};

export default nextConfig;
