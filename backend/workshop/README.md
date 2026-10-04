# Workshop registration service

Google Apps Script source for the 14 October 2026 workshop. No credentials or registrant data belong in GitHub.

## Activation checklist

- Import the private registration workbook to the owner's Drive. Its `נרשמים` sheet must use the exact HEADERS from Code.gs. Do not publish the sheet or share it with anyone without authorization.
- Create an Apps Script project containing Code.gs and Registration.html. Set SPREADSHEET_ID in Script Properties, not frontend code.
- Authorize Sheets access. Email/trigger scopes must only be granted when enabling reminder delivery with the owner's approval. Remove them from the manifest for a registration-only deployment.
- Deploy a web app executing as the owner, accessible to Anyone. Public visitors can submit contacts, but there is no read/list API and no publicly exposed sheet ID.
- Embed the observed /exec URL on workshop.html only after a real test registration is confirmed in the private sheet. Never infer success from iframe load or an opaque HTTP response.
- The configured checkout is a Paperless sales page using its connected Grow credit checkout. Paperless advertises automatic receipts for this route; end-to-end receipt delivery still requires a real paid transaction. The previous direct Grow payment-link transaction did not appear in Paperless and needs separate reconciliation. The Paperless page has 29 remaining units to account for that existing paid couple; keep both routes from selling independently beyond capacity.
- Payment notification for the Paperless route has not been verified. The legacy **static-page** Grow webhook adapter below must not be enabled for this route without a confirmed compatible payload. Obtain any required page key and webhook key via secure owner-managed configuration; set GROW_PAGE_KEY and GROW_WEBHOOK_KEY in Script Properties only after confirmation.
- Leave GROW_WEBHOOK_ENABLED unset until Grow confirms payload type/authentication. This adapter only supports the documented static-page payload, not API callbacks or paymentLink payloads. Validate a provider-originated test event before setting it to true. Amount and page identity are checked, transactions are deduplicated, and the public form cannot mark payment complete.
- Add ZOOM_URL privately, then authorize reminder sending and set EMAIL_ENABLED=true. Run installReminderTrigger. The hourly trigger sends only on 13 October, only to matched paid registrations with consent; unmatched payments require review first. The public site must not reveal Zoom_URL.
- If Grow webhook activation is unavailable, reconcile verified transactions manually into the sheet. Never label all form submissions as paid.

## Security and operations

No credit-card data is stored. Public inputs are validated and formula-escaped. Registration writes use a lock, a short-lived form nonce, a honeypot, duplicate contact handling, a daily write limit and a total-row limit. These are basic anti-abuse controls, not a CAPTCHA/WAF; monitor quotas and failed executions during the registration period.

Email delivery is at-least-once: a process crash between a successful send and recording its timestamp can cause a duplicate reminder. Failures remain unsent for retry. Google quotas apply; monitor execution logs without logging request payloads/secrets. A paid event without unique matching email and phone is stored as `שולם — לבדיקה` and does not receive automatic email. Never overwrite a payment with a conflicting transaction.

Before launch: verify the deployment's access is Anyone, then test valid/invalid input, duplicate registration, storage failure, capacity reached, unauthorized and replayed webhook, unmatched payment, email disabled/no Zoom, reminder date and mail failure. A signed-in owner test does not prove anonymous registration access. Updating repository source does not update the Apps Script deployment; publish a new version separately and verify the returned checkout URL.
