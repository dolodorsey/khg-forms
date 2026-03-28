import { NextResponse } from 'next/server';

// Map apply.* subdomains to brand keys
const DOMAIN_BRAND_MAP = {
  'apply.huglife.us': 'huglife',
  'apply.thaoldatlanta.com': 'maga',
  'apply.stushusa.com': 'stush',
  'apply.foreverfutbolmuseum.com': 'forever-futbol',
  'apply.caspergroupworldwide.com': 'casper',
  'apply.infinitywaterco.com': 'infinity-water',
  'apply.prontoenergydrink.com': 'pronto-energy',
  'partners.thegoodtimesworldwide.com': 'good-times',
  'forms.thekollectivehospitality.com': null, // central directory — no redirect
};

export function middleware(request) {
  const host = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  
  // Check if this is a brand-specific subdomain
  const brand = DOMAIN_BRAND_MAP[host];
  
  if (brand && pathname === '/') {
    // Redirect root to the brand's landing page with all their forms
    const url = request.nextUrl.clone();
    url.pathname = `/brand/${brand}`;
    return NextResponse.rewrite(url);
  }
  
  if (brand && !pathname.startsWith('/brand/') && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
    // Rewrite /dj → /[brand]/dj, /volunteer → /[brand]/volunteer, etc.
    const role = pathname.replace(/^\//, '');
    if (role && !role.includes('/')) {
      const url = request.nextUrl.clone();
      url.pathname = `/${brand}/${role}`;
      return NextResponse.rewrite(url);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
