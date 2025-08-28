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
    const negotiator = new Negotiator({headers: {"accept-language": acceptLanguageHeader}});
    const languages = negotiator.languages();
    return match(languages, locales, defaultLocale) 
}


export function middleware(request: NextRequest) {
    // Check if there is any supported locale in the pathname
    const { pathname } = request.nextUrl
    const pathnameHasLocale = locales.some(
      (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    )
   
    if (pathnameHasLocale) return
   
    // Redirect if there is no locale
    const locale = getLocaleFromHeader(request)
    request.nextUrl.pathname = `/${locale}${pathname}`
    // e.g. incoming request is /products
    // The new URL is now /en-US/products
    return NextResponse.redirect(request.nextUrl)
  }
   
  export const config = {
    // matcher: [
    //   // Skip all internal paths (_next)
    //   '/((?!_next).*)',
    //   // Optional: only run on root (/) URL
    //   // '/'
    // ],
    matcher: ['/((?!_next|favicon.ico|robots.txt|__\\/auth(?:\\/.*)?|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.ico|.*\\.webp|.*\\.json|.*\\.txt).*)'],
  }
