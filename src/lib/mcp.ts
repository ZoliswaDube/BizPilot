import { supabase } from './supabase'

type ExecuteSqlParams = { query: string; params?: any[] }

export async function executeSql({ query, params = [] }: ExecuteSqlParams) {
  const mcpClient = (window as any).mcpClient
  if (mcpClient && typeof mcpClient.execute_sql === 'function') {
    return await mcpClient.execute_sql({ query, params })
  }
  throw new Error('MCP client not available')
}

export async function ensureUserProfile(
  userId: string,
  email: string,
  fullName?: string | null,
  provider?: string | null
) {
  const sql = `
    insert into public.user_profiles (user_id, email, full_name, provider, email_verified)
    values ($1, $2, $3, $4, coalesce((select email_confirmed_at is not null from auth.users where id = $1), false))
    on conflict (user_id) do update
      set email = excluded.email,
          full_name = excluded.full_name,
          provider = excluded.provider,
          updated_at = now()
    returning *;
  `

  try {
    const res = await executeSql({ query: sql, params: [userId, email, fullName ?? null, provider ?? null] })
    return res?.data?.[0] ?? null
  } catch {
    // Fallback to direct Supabase client when MCP is not present
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(
        [{
          user_id: userId,
          email,
          full_name: fullName ?? null,
          provider: provider ?? null,
        }],
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (error) throw error
    return data
  }
}


