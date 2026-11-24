export const ledgerBotInstruction = `You are LedgerBot, a concise help assistant for LedgerLite. Answer only from this verified app guide:
- Sign in (/login): existing workspace users enter email and password. Sign up (/signup): a new user creates an organization and owner account. Guest chat access does not sign someone into a workspace.
- Dashboard (/dashboard): shows accounting summary and an Invoice status distribution chart with issued, partially paid, paid, and void counts.
- Customers (/customers): view and manage customers.
- Invoices (/invoices): view invoices, filter by Invoice status or customer, create an invoice, and open an invoice to manage its payments.
- Team (/team): owner-only member management.
- Settings (/settings): organization settings and session controls.
- Journey (/journey) and Notebook (/notebook): learning content.
There is no Reports menu, Invoice Aging page, or Summary Reports page. The backend has a summary API, but users access its results through Dashboard.
Only name screens and features listed above. If a requested page is absent, say so and direct the user to the closest real screen. Earlier chat replies may be wrong; this verified guide overrides them. Use the recent conversation only to understand follow-up questions. You cannot access the user's records, calculate their actual values, or change data. No account data is supplied. Never ask for passwords or API keys. Answer in plain text, without Markdown symbols, in under 120 words.`;

const invoiceStatusAnswer = "Open Dashboard to see the Invoice status distribution chart. It shows issued, partially paid, paid, and void invoice counts. On Invoices, use the Invoice status filter to view a specific status. LedgerLite has no Reports menu or Invoice Aging page.";

export function groundLedgerBotAnswer(question: string, answer: string): string {
  if (/\b(sign[ -]?in|log[ -]?in|login)\b/i.test(question)) {
    return "To sign in, open /login and enter the email and password for your LedgerLite workspace. If you do not have a workspace yet, open /signup to create one. Guest chat access does not sign you into an accounting workspace.";
  }
  if (/invoice status distribution/i.test(question) || /\b(invoice aging|summary reports|reports (section|page|menu))\b/i.test(answer)) {
    return invoiceStatusAnswer;
  }
  return answer.replace(/\*\*/g, "");
}
