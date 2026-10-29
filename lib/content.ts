// Everything a visitor reads lives here: the sample trade, its jobs, the reminder
// wording and the captions. Change words here, not in the components.

export type Ledger = "xero" | "quickbooks";
export type Tone = "gentle" | "firm";

export const DEMO_TODAY = new Date(Date.UTC(2026, 9, 12)); // 12 Oct 2026, scrub day 0
export const PAYMENT_TERMS_DAYS = 14;
export const MAX_REMINDERS = 3;
export const REPEAT_EVERY_DAYS = 7;

export const TRADE = {
  name: "Dave's Plumbing",
  owner: "Dave",
  town: "Leith, Edinburgh",
  sort: "80-22-60",
  account: "12345678",
};

export type SeedJob = {
  id: string;
  customer: string;
  email: string;
  job: string;
  finished: string; // yyyy-mm-dd
  amount: number;
  done: boolean;
  paidOn?: string; // yyyy-mm-dd, only for jobs paid before the demo starts
};

export const SEED_JOBS: SeedJob[] = [
  { id: "j1", customer: "Sarah Whitfield", email: "sarah.w@example.com", job: "Bathroom tap replacement", finished: "2026-09-12", amount: 180, done: true },
  { id: "j2", customer: "Tom Okafor", email: "tom.okafor@example.com", job: "Annual boiler service", finished: "2026-09-28", amount: 95, done: true, paidOn: "2026-10-02" },
  { id: "j3", customer: "Priya Nair", email: "priya@example.com", job: "Kitchen sink and waste", finished: "2026-10-01", amount: 340, done: true },
  { id: "j4", customer: "Greenway Lettings", email: "repairs@greenway.example", job: "Bathroom refit, Flat 4 Constitution St", finished: "2026-09-20", amount: 2450, done: true },
  { id: "j5", customer: "Mark Ellis", email: "m.ellis@example.com", job: "Outside tap", finished: "2026-10-06", amount: 120, done: true, paidOn: "2026-10-07" },
  { id: "j6", customer: "Helen Baird", email: "helen.baird@example.com", job: "Radiator bleed and valve", finished: "2026-10-10", amount: 85, done: false },
];

export const LEDGER_LABEL: Record<Ledger, string> = {
  xero: "Xero",
  quickbooks: "QuickBooks",
};

// Reminder wording. {name}, {no}, {job}, {amount}, {due}, {owner}, {trade} are filled in.
export const REMINDERS: Record<Tone, [string, string, string]> = {
  gentle: [
    "Hi {name}, just a quick note that invoice {no} for the {job} ({amount}) was due on {due}. If it's already on its way, thank you. If not, the bank details are on the invoice. {owner}",
    "Hi {name}, a gentle nudge about invoice {no} ({amount}), due {due}. I know these things slip. If anything on the invoice doesn't look right, reply and I'll sort it. {owner}",
    "Hi {name}, invoice {no} ({amount}) is now well past its due date of {due}. Could you let me know when I can expect it? Happy to talk if there's a problem. {owner}, {trade}",
  ],
  firm: [
    "Hi {name}, invoice {no} for the {job} ({amount}) was due on {due} and hasn't arrived. Please pay by bank transfer using the details on the invoice. {owner}, {trade}",
    "Hi {name}, second reminder: invoice {no} ({amount}) is overdue since {due}. Please settle it this week or reply to let me know why not. {owner}, {trade}",
    "Hi {name}, final reminder for invoice {no} ({amount}), overdue since {due}. If it isn't paid within 7 days I'll have to add late payment interest as the invoice allows. {owner}, {trade}",
  ],
};

export const SUBJECTS: Record<Tone, [string, string, string]> = {
  gentle: ["Invoice {no}: a quick reminder", "Invoice {no}: still open", "Invoice {no}: can you let me know?"],
  firm: ["Invoice {no} is overdue", "Second reminder: invoice {no}", "Final reminder: invoice {no}"],
};

export const CAPTIONS = {
  jobs: "This is your job list. In the real thing it comes from your spreadsheet or Jobber. Edit any cell, or paste rows from Excel.",
  invoice: "Tick a job as done and the invoice is written for you. In the real product it is created inside your {ledger} through {ledger}'s own connection, numbered the way {ledger} numbers things.",
  inbox: "This is what your customer sees. Nothing is sent from this page. In the real product the reminder lands in your own Drafts first, and you press send.",
  paid: "In the first version you tick Paid yourself. Later the bank feed in {ledger} does it.",
  list: "Your Monday morning list. Anything over the amount you set never gets chased automatically. It waits for you.",
  footer: "A working demo by Quietside. Nothing you type here is saved or sent. Xero and QuickBooks are the names of their owners' products; this page only shows what an invoice looks like in each.",
};
