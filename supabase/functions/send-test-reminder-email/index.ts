/// <reference path="../types/edge-runtime.d.ts" />

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL =
  Deno.env.get('REMINDER_FROM_EMAIL') ?? 'My Calendar <onboarding@resend.dev>';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return jsonResponse({ error: 'user_id required' }, 400);
    }

    if (!RESEND_API_KEY) {
      return jsonResponse({ error: 'RESEND_API_KEY not configured' }, 500);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      data: { user },
    } = await supabase.auth.admin.getUserById(user_id);

    if (!user?.email) {
      return jsonResponse({ error: 'User email not found' }, 404);
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [user.email],
        subject: 'Test Email - My Calendar Reminders',
        html: `
          <h1>Test Email Successful</h1>
          <p>Your email reminder settings are working correctly.</p>
          <p>You will receive reminders for upcoming events based on your preferences.</p>
          <hr>
          <p><small>This is a test email from My Calendar.</small></p>
        `,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Resend error:', data);
      return jsonResponse({ error: 'Failed to send email', details: data }, 500);
    }

    return jsonResponse({ success: true, id: data.id });
  } catch (error) {
    console.error('Error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});
