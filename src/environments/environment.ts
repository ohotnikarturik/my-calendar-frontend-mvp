/**
 * Development Environment Configuration
 *
 * Learning note: Environment files allow you to configure different settings
 * for development vs production. Angular's build system automatically swaps
 * these files based on the build configuration.
 *
 * IMPORTANT: Never commit real API keys to version control!
 * - Add environment.ts and environment.prod.ts to .gitignore
 * - Or use placeholder values and set real values via environment variables in CI/CD
 *
 * To get your Supabase credentials:
 * 1. Go to https://supabase.com and create a project
 * 2. Navigate to Settings → API
 * 3. Copy the Project URL and anon/public key
 */
export const environment = {
  production: false,

  // Supabase Configuration
  // Replace these with your actual Supabase project credentials
  supabaseUrl: 'YOUR_SUPABASE_PROJECT_URL', // e.g., 'https://abcdefgh.supabase.co'
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY', // The anon/public key (NOT the service role key!)
};
