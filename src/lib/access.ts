/**
 * Optioneel: alleen deze e-mailadressen mogen inloggen (komma-gescheiden),
 * bijv. ALLOWED_EMAILS="emma@mail.nl,lucas@mail.nl". Leeg = iedereen met een account.
 * Werkt server-side (proxy, API-routes); de variabele komt niet in de browser.
 */
const allowed = (process.env.ALLOWED_EMAILS ?? "")
  .split(/[,;\s]+/)
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const isEmailAllowed = (email: string | null | undefined) =>
  allowed.length === 0 || (!!email && allowed.includes(email.toLowerCase()));
