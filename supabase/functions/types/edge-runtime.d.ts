/** Minimal types for Supabase Edge Functions (Deno runtime) in this Angular repo. */

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

declare module 'https://deno.land/std@0.168.0/http/server.ts' {
  export function serve(
    handler: (req: Request) => Response | Promise<Response>
  ): void;
}

declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export function createClient(
    url: string,
    key: string
  ): {
    from: (table: string) => {
      select: (columns?: string) => {
        eq: (
          column: string,
          value: unknown
        ) => Promise<{ data: unknown; error: Error | null }>;
      };
      update: (values: Record<string, unknown>) => {
        eq: (
          column: string,
          value: unknown
        ) => Promise<{ data: unknown; error: Error | null }>;
      };
    };
    auth: {
      admin: {
        getUserById: (
          userId: string
        ) => Promise<{ data: { user: { email?: string } | null } }>;
      };
    };
  };
}
