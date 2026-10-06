// Campaign-estimate endpoint. The form posts here directly, so it does not depend on
// Netlify Forms form-detection being enabled. Validates server-side, then sends the
// notification through the Netlify Emails integration.
//
// Environment variables (all server-side; none reach the browser):
//   NETLIFY_EMAILS_SECRET     required — the Netlify Emails shared secret
//   ESTIMATE_TO_EMAIL         optional — defaults to mustafa@ouroptimization.com
//   ESTIMATE_FROM_EMAIL       optional — defaults to ESTIMATE_TO_EMAIL. Must be a sender
//                             the email provider has verified.

const TO_DEFAULT = 'mustafa@ouroptimization.com';
const DASH = '—';

const json = (code, body) => ({
  statusCode: code,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const digits = s => (s || '').replace(/\D/g, '');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST.' });

  // Accept either a urlencoded form post or JSON.
  let d = {};
  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body;
    if ((event.headers['content-type'] || '').includes('application/json')) {
      d = JSON.parse(raw);
    } else {
      const params = new URLSearchParams(raw);
      for (const [k, v] of params) d[k] = v;
      // Checkbox groups repeat the same name; keep every value, not just the last.
      d.channels = params.getAll('channels');
    }
  } catch {
    return json(400, { error: 'Could not read the submission.' });
  }

  // Honeypot: accept silently so a bot sees success and moves on, but send nothing.
  if ((d['bot-field'] || '').trim()) return json(200, { ok: true });

  // Server-side validation repeating the client rules — the client checks are a courtesy.
  const errors = {};
  const clinic = (d.clinic || '').trim();
  const contact = (d.contact || '').trim();
  const email = (d.email || '').trim();
  const phone = (d.phone || '').trim();

  if (clinic.length < 2) errors.clinic = 'Enter the name of your clinic so we know who the estimate is for.';
  if (contact.length < 2) errors.contact = 'Enter your name so we know who to address the estimate to.';
  if (!email && !phone) {
    errors.email = 'Add an email address or a phone number so we can send you the estimate.';
  } else {
    if (email && !/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(email)) {
      errors.email = 'Enter an email address we can reply to — like you@yourclinic.com.';
    }
    if (phone) {
      const n = digits(phone);
      if (n.length !== 10 && !(n.length === 11 && n[0] === '1')) {
        errors.phone = 'Enter a 10-digit phone number with the area code, like (630) 555-0142.';
      }
    }
  }
  if ((d.address || '').length > 200) errors.address = 'Keep the address under 200 characters.';
  if ((d.target_area || '').length > 300) errors.area = 'Keep this under 300 characters.';
  if ((d.notes || '').length > 2000) errors.notes = 'Keep this under 2,000 characters.';
  if ((d.target_service || '').length > 150) errors.service = 'Keep this under 150 characters.';
  const channels = (Array.isArray(d.channels) ? d.channels : [d.channels])
    .map(c => String(c || '').trim()).filter(Boolean).slice(0, 12).join(', ');
  if (Object.keys(errors).length) return json(422, { errors });

  const secret = process.env.NETLIFY_EMAILS_SECRET;
  if (!secret) {
    console.error('NETLIFY_EMAILS_SECRET is not set — the submission could not be emailed.');
    return json(500, { error: 'Email is not configured.' });
  }

  const to = process.env.ESTIMATE_TO_EMAIL || TO_DEFAULT;
  const from = process.env.ESTIMATE_FROM_EMAIL || to;
  const base = process.env.URL || process.env.DEPLOY_PRIME_URL || '';

  const res = await fetch(`${base}/.netlify/functions/emails/campaign-estimate`, {
    method: 'POST',
    headers: { 'netlify-emails-secret': secret, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to,
      subject: `New Campaign Estimate — ${clinic}`,
      parameters: {
        clinic,
        contact,
        email: email || DASH,
        phone: phone || DASH,
        website: (d.website || '').trim() || DASH,
        address: (d.address || '').trim() || DASH,
        clinic_type: (d.clinic_type || '').trim() || DASH,
        promote: (d.promote || '').trim() || DASH,
        target_service: (d.target_service || '').trim() || DASH,
        budget: (d.budget || '').trim() || DASH,
        channels: channels || DASH,
        campaign_size: (d.campaign_size || '').trim() || DASH,
        target_area: (d.target_area || '').trim() || DASH,
        notes: (d.notes || '').trim() || DASH,
        submitted_at: new Date().toISOString(),
      },
    }),
  });

  if (!res.ok) {
    console.error('Netlify Emails rejected the send:', res.status, await res.text());
    return json(502, { error: 'The notification could not be sent.' });
  }
  return json(200, { ok: true });
};
