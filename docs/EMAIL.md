# Auth emails — যাদুল মুসলিম branding

Branded Bengali templates live in `supabase/templates/`. Subjects are in `supabase/templates/subjects.txt`.

| Supabase template | File | Link type |
|---|---|---|
| Confirm signup | `confirmation.html` | `type=email` → `/account` |
| Reset password | `recovery.html` | `type=recovery` → `/reset-password` |
| Magic link | `magic_link.html` | `type=email` → `/account` |
| Change email address | `email_change.html` | `type=email_change` → `/account` |
| Invite user | `invite.html` | `type=invite` → `/reset-password` |

## Install (Supabase Dashboard)

1. **Authentication → Emails → Templates**
2. For each template above: paste the subject from `subjects.txt`, switch the body to **Source**, paste the whole HTML file, then **Save**.
3. **Authentication → URL Configuration → Site URL** must be `https://www.zadulmuslim.org`, because the templates build links from `{{ .SiteURL }}`.

### Why these links matter

The templates link to `/auth/confirm?token_hash=…`, which works in **any** browser, including the Gmail app's built-in browser. Supabase's default template uses a code-based (PKCE) link that only works in the browser where the person signed up. Opened anywhere else, it looked like an error even though the email was already confirmed. The confirm route now handles both kinds of link gracefully.

## Sender name and delivery limits (strongly recommended)

With Supabase's built-in mailer, emails come from **"Supabase Auth" &lt;noreply@mail.app.supabase.io&gt;**. That mailer is only meant for testing: it sends just a few emails per hour, so real users won't receive their confirmation emails reliably.

To send as **যাদুল মুসলিম &lt;no-reply@zadulmuslim.org&gt;**, set up custom SMTP, for example with Resend (free tier: 3,000 emails/month):

1. Create an account at resend.com, add the domain `zadulmuslim.org`, and add the DNS records it shows (SPF, DKIM, MX for bounces) in **Cloudflare → zadulmuslim.org → DNS**. Set them to **DNS only** (grey cloud).
2. Wait for Resend to show the domain as *Verified*, then create an API key.
3. Supabase → **Authentication → Emails → SMTP Settings → Enable custom SMTP**:
   - Sender email: `no-reply@zadulmuslim.org` · Sender name: `যাদুল মুসলিম`
   - Host `smtp.resend.com` · Port `465` · Username `resend` · Password: the API key
4. Supabase → **Authentication → Rate Limits**: raise "emails sent per hour" (for example, to 100).
