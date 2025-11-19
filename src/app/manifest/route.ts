import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return new NextResponse('Username is required', { status: 400 });
  }

  const manifest = {
    name: `Check-in for ${username}`,
    short_name: `Check-in`,
    description: `Check-in/out application for ${username}`,
    start_url: `/${encodeURIComponent(username)}`,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#007bff',
    icons: [
      {
        src: 'https://datacenter.novamodular.co.th/img/nova_logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://datacenter.novamodular.co.th/img/nova_logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };

  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
    },
  });
}
