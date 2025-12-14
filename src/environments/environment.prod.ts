/**
 * Production Environment Configuration
 *
 * Learning note: This file is used when building for production.
 * In a real production setup, you would:
 * 1. Set these values via CI/CD environment variables
 * 2. Or use a secrets management system
 * 3. Never hardcode production credentials in source code
 *
 * For deployment (e.g., Vercel, Netlify, Firebase Hosting):
 * - Set environment variables in the hosting platform's dashboard
 * - Update your build script to inject these values
 */
export const environment = {
  production: true,

  // Supabase Configuration
  // In production, these should be injected via environment variables
  supabaseUrl: 'YOUR_SUPABASE_PROJECT_URL',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
};
