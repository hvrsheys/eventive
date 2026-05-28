/* global process */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL

  if (!webhookUrl) {
    return res.status(503).json({ error: 'Google Sheets webhook is not configured' })
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: JSON.stringify(req.body),
    })

    if (!response.ok) {
      return res.status(502).json({ error: 'Google Sheets request failed' })
    }

    return res.status(200).json({ ok: true })
  } catch {
    return res.status(500).json({ error: 'Attendance sync failed' })
  }
}
