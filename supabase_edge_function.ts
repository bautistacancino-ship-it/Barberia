
// @ts-nocheck
/**
 * Supabase Edge Function: send-reminder
 * 
 * This function is triggered by a Cron Job to send reminders to customers
 * whose last cut was exactly 14 days ago.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Query customers to notify (using the view created in SQL)
    const { data: customers, error } = await supabase
      .from('customers_to_notify')
      .select('*')

    if (error) throw error

    console.log(`Found ${customers?.length} customers to notify`)

    // 2. Iterate and send notifications (Example using a hypothetical email service)
    for (const customer of (customers || [])) {
      console.log(`Sending reminder to ${customer.full_name} (${customer.phone})`)
      
      /**
       * Integration Example (Resend):
       * 
       * await fetch('https://api.resend.com/emails', {
       *   method: 'POST',
       *   headers: {
       *     'Content-Type': 'application/json',
       *     'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`
       *   },
       *   body: JSON.stringify({
       *     from: 'Barbería Elite <citas@tu-barberia.com>',
       *     to: customer.email,
       *     subject: '¡Es hora de tu próximo corte!',
       *     html: `<p>Hola ${customer.full_name}, han pasado 2 semanas desde tu último corte. ¡Reserva tu hora ahora!</p>`
       *   })
       * })
       */
    }

    return new Response(JSON.stringify({ success: true, count: customers?.length }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})

/**
 * CRON JOB SETUP (Supabase Dashboard -> SQL Editor)
 * 
 * -- Enable pg_cron extension
 * CREATE EXTENSION IF NOT EXISTS pg_cron;
 * 
 * -- Schedule the job to run every day at 9:00 AM
 * SELECT cron.schedule(
 *   'send-daily-reminders',
 *   '0 9 * * *',
 *   $$
 *   SELECT
 *     net.http_post(
 *       url:='https://your-project-ref.functions.supabase.co/send-reminder',
 *       headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
 *     ) as request_id;
 *   $$
 * );
 */
