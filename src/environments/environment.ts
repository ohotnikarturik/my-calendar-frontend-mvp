/**
 * Development Environment Configuration
 *
 * Angular reads THIS file at build time — not .env.
 * Keep supabaseUrl + supabaseAnonKey in sync with .env (SUPABASE_URL, SUPABASE_ANON_KEY).
 *
 * What goes where:
 * - Here (public): Supabase URL + anon/publishable key — safe in the browser (RLS protects data)
 * - .env (local, gitignored): same public keys + secrets for Supabase CLI
 * - Supabase Dashboard secrets: RESEND_API_KEY, REMINDER_FROM_EMAIL (Edge Functions)
 * - Supabase Dashboard Auth: Google OAuth client id/secret
 *
 * Never put service_role key or RESEND_API_KEY in this file.
 */
export const environment = {
  production: false,
  supabaseUrl: 'https://rntnwarjiejeqfrsyzvr.supabase.co',
  supabaseAnonKey: 'sb_publishable_CtGswmdAjwcnahMC1WDHXQ_-loebxO6',
};
