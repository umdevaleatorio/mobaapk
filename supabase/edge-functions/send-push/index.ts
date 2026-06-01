import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: pending } = await supabase
    .from('notification_queue')
    .select('id, user_id, title, body, type')
    .eq('status', 'pending')
    .eq('type', 'push')
    .limit(50);

  if (!pending || pending.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  let sent = 0;
  for (const item of pending) {
    const { data: user } = await supabase
      .from('users')
      .select('push_token')
      .eq('id', item.user_id)
      .single();

    if (!user?.push_token) {
      await supabase
        .from('notification_queue')
        .update({ status: 'failed' })
        .eq('id', item.id);
      continue;
    }

    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.push_token,
          title: item.title,
          body: item.body,
          sound: 'default',
        }),
      });

      if (res.ok) {
        await supabase
          .from('notification_queue')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', item.id);
        sent++;
      } else {
        await supabase
          .from('notification_queue')
          .update({ status: 'failed' })
          .eq('id', item.id);
      }
    } catch {
      await supabase
        .from('notification_queue')
        .update({ status: 'failed' })
        .eq('id', item.id);
    }
  }

  return new Response(JSON.stringify({ sent, total: pending.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
