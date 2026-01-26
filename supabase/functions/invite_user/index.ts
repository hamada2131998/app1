

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Fix: Use globalThis to access the Deno namespace to resolve "Cannot find name 'Deno'" error
    const supabaseAdmin = createClient(
      (globalThis as any).Deno.env.get('SUPABASE_URL') ?? '',
      (globalThis as any).Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 1. التحقق من هوية الداعي (Inviter)
    const authHeader = req.headers.get('Authorization')!
    const { data: { user: inviter }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !inviter) throw new Error("Unauthorized")

    const { email, full_name, role, company_id } = await req.json()

    // 2. التحقق أن الداعي هو OWNER في هذه الشركة حصراً
    const { data: inviterRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', inviter.id)
      .eq('company_id', company_id)
      .single()

    if (!inviterRole || inviterRole.role !== 'OWNER') {
      throw new Error("Only owners can invite users")
    }

    // 3. إرسال الدعوة عبر البريد
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: full_name },
      redirectTo: `${new URL(req.url).origin}/login`
    })

    if (inviteError) throw inviteError

    // 4. إنشاء الملف الشخصي والدور فوراً
    await supabaseAdmin.from('profiles').upsert({ id: inviteData.user.id, full_name })
    await supabaseAdmin.from('user_roles').insert({ 
      user_id: inviteData.user.id, 
      company_id: company_id, 
      role: role 
    })

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
