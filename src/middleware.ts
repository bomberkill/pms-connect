import 'server-only'
import { NextRequest, NextResponse } from 'next/server';
// import { locales, defaultLocale } from '@/i18n/settings';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

export const defaultLocale = 'en'
export const locales = [defaultLocale, 'fr']

function getLocaleFromHeader(request: NextRequest): string {
  const acceptLanguageHeader = request.headers.get('accept-language');
  if (!acceptLanguageHeader) {
    console.log("No accept-language header, using default locale:", defaultLocale);
    return defaultLocale;
  }
  const negotiator = new Negotiator({ headers: { "accept-language": acceptLanguageHeader } });
  const languages = negotiator.languages();
  return match(languages, locales, defaultLocale)
}

function getLocaleFromReferer(request: NextRequest): string | null {
  const referer = request.headers.get('referer');
  if (!referer) return null;

  try {
    const refererUrl = new URL(referer);
    return locales.find(
      (locale) =>
        refererUrl.pathname.startsWith(`/${locale}/`) ||
        refererUrl.pathname === `/${locale}`,
    ) ?? null;
  } catch {
    return null;
  }
}


export function middleware(request: NextRequest) {
  // Check if there is any supported locale in the pathname
  const { pathname } = request.nextUrl
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasLocale) return NextResponse.next()

  // Redirect if there is no locale
  const locale = getLocaleFromReferer(request) ?? getLocaleFromHeader(request)
  request.nextUrl.pathname = `/${locale}${pathname}`

  // Server Actions use POST. Redirecting those requests breaks Next's action
  // protocol and surfaces as "unexpected response from the server".
  if (request.method !== 'GET') {
    return NextResponse.rewrite(request.nextUrl)
  }

  // e.g. incoming request is /products
  // The new URL is now /en/products
  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  // matcher: [
  //   // Skip all internal paths (_next)
  //   '/((?!_next).*)',
  //   // Optional: only run on root (/) URL
  //   // '/'
  // ],
  matcher: ['/((?!_next|api|favicon.ico|robots.txt|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.ico|.*\\.webp|.*\\.json|.*\\.txt|.*\\.js).*)'],
}
