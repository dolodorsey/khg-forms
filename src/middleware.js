import { NextResponse } from 'next/server';

// Map apply.* subdomains to brand keys. Brand aliases stay independent while
// every public submission routes through the secure universal form renderer.
const DOMAIN_BRAND_MAP = {
  'apply.huglife.us': 'huglife',
  'apply.thaoldatlanta.com': 'maga',
  'apply.stushusa.com': 'stush',
  'apply.foreverfutbolmuseum.com': 'forever-futbol',
  'apply.caspergroupworldwide.com': 'casper',
  'apply.infinitywaterco.com': 'infinity-water',
  'apply.prontoenergydrink.com': 'pronto-energy',
  'partners.thegoodtimesworldwide.com': 'good-times',
  'forms.thekollectivehospitality.com': null,
};

export function middleware(request) {
  const host = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  const brand = DOMAIN_BRAND_MAP[host];

  if (brand && pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = `/brand/${brand}`;
    return NextResponse.rewrite(url);
  }

  if (
    brand &&
    !pathname.startsWith('/brand/') &&
    !pathname.startsWith('/f/') &&
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/api')
  ) {
    // Preserve simple public aliases like /dj, /vendor, /ambassador, /quote,
    // but send them through /f so the browser never inserts directly into DB.
    const role = pathname.replace(/^\//, '');
    if (role && !role.includes('/')) {
      const url = request.nextUrl.clone();
      url.pathname = `/f/${brand}/${role}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
