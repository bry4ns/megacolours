import type { NextConfig } from 'next'
const apiOrigin = process.env.API_ORIGIN || (process.env.NODE_ENV === 'production' ? 'http://megacolours-api:4000' : 'http://127.0.0.1:4000');

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites(){ return [{source:'/api/:path*',destination:`${apiOrigin}/api/:path*`}] }
}
export default nextConfig
