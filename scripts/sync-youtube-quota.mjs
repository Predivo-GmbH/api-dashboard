// Syncs ChannelMover's YouTube Data API v3 daily quota USAGE to the BackOffice dashboard.
//
// Unlike the Anthropic/Gemini scrapers, this does NOT scrape Google (that requires
// datacenter-IP Google cookies — the exact thing that keeps the Gemini scrape broken).
// ChannelMover already logs every Data API call to its own `youtube_api_quota_log`
// table, so usage is read straight from our DB — real-time and 100% reliable.
//
// The daily LIMIT is the Google grant (a config value, changes only on a new grant).

const CM_SUPABASE_URL = process.env.CHANNELMOVER_SUPABASE_URL   // ChannelMover Supabase (qswluv...)
const CM_SERVICE_KEY = process.env.CHANNELMOVER_SERVICE_KEY     // ChannelMover service_role key
const BO_SUPABASE_URL = process.env.BACKOFFICE_SUPABASE_URL     // BackOffice Supabase (xoecp...)
const BO_SERVICE_KEY = process.env.BACKOFFICE_SERVICE_KEY       // BackOffice service_role key

// The daily LIMIT (quota_limit) is owned by the BackOffice dashboard itself (seeded to
// 200,000 — matching ChannelMover's conservative DAILY_DATA_API_QUOTA; the real Google
// grant is 210,000). This job does NOT set quota_limit (BackOffice's own sync would just
// reset it); it reads the current limit and writes today's USAGE + derived remaining.
const API_NAME = 'YouTube Data API v3'

/** Start of the current Pacific (America/Los_Angeles) day as a UTC ISO instant. */
function pacificDayStartIso() {
  const now = new Date()
  const pacific = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }))
  const midnight = new Date(pacific)
  midnight.setHours(0, 0, 0, 0)
  return new Date(now.getTime() + (midnight.getTime() - pacific.getTime())).toISOString()
}

/**
 * Sum today's Data API units from ChannelMover's quota log. PostgREST aggregate
 * functions are disabled, so we page through the rows (1000/page) and sum locally.
 * At the 210k/day cap there are at most ~4,200 write rows, so this is a few pages.
 */
async function getUsageToday() {
  const since = pacificDayStartIso()
  const PAGE = 1000
  let total = 0
  let offset = 0
  for (;;) {
    const url = `${CM_SUPABASE_URL}/rest/v1/youtube_api_quota_log?created_at=gte.${since}&select=units_cost&limit=${PAGE}&offset=${offset}`
    const res = await fetch(url, {
      headers: { apikey: CM_SERVICE_KEY, Authorization: `Bearer ${CM_SERVICE_KEY}` },
    })
    if (!res.ok) throw new Error(`ChannelMover quota query failed: ${res.status} ${await res.text()}`)
    const rows = await res.json()
    for (const r of rows) total += Number(r.units_cost ?? 0)
    if (rows.length < PAGE) break
    offset += PAGE
  }
  return total
}

/** Write today's usage + derived remaining onto the BackOffice dashboard subscription. */
async function updateBackOffice(used) {
  // Find the api_entry id by name
  const eRes = await fetch(
    `${BO_SUPABASE_URL}/rest/v1/api_entries?name=eq.${encodeURIComponent(API_NAME)}&select=id`,
    { headers: { apikey: BO_SERVICE_KEY, Authorization: `Bearer ${BO_SERVICE_KEY}` } },
  )
  const entries = await eRes.json()
  if (!entries?.length) throw new Error(`"${API_NAME}" not found in BackOffice api_entries`)
  const apiEntryId = entries[0].id

  // Read the limit BackOffice owns, then derive remaining against it (so we stay consistent
  // whatever the configured limit is — we never fight BackOffice over quota_limit).
  const sRes = await fetch(
    `${BO_SUPABASE_URL}/rest/v1/api_subscriptions?api_entry_id=eq.${apiEntryId}&select=quota_limit`,
    { headers: { apikey: BO_SERVICE_KEY, Authorization: `Bearer ${BO_SERVICE_KEY}` } },
  )
  const subs = await sRes.json()
  const limit = Number(subs?.[0]?.quota_limit ?? 200000)
  const remaining = Math.max(0, limit - used)

  const res = await fetch(
    `${BO_SUPABASE_URL}/rest/v1/api_subscriptions?api_entry_id=eq.${apiEntryId}`,
    {
      method: 'PATCH',
      headers: {
        apikey: BO_SERVICE_KEY,
        Authorization: `Bearer ${BO_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        current_usage: used,
        credits_remaining: remaining,
      }),
    },
  )
  if (!res.ok) throw new Error(`BackOffice update failed: ${res.status} ${await res.text()}`)
  console.log(`BackOffice updated: ${used} used / ${limit} (=${remaining} left today)`)
}

async function main() {
  for (const [k, v] of Object.entries({ CM_SUPABASE_URL, CM_SERVICE_KEY, BO_SUPABASE_URL, BO_SERVICE_KEY })) {
    if (!v) { console.error(`Missing env: ${k}`); process.exit(1) }
  }
  const used = await getUsageToday()
  console.log(`ChannelMover YouTube Data API usage today (Pacific): ${used} units`)
  await updateBackOffice(used)

  const output = process.env.GITHUB_OUTPUT
  if (output) {
    const fs = await import('fs')
    fs.appendFileSync(output, `used=${used}\n`)
  }
}

main().catch(err => { console.error('Failed:', err.message); process.exit(1) })
