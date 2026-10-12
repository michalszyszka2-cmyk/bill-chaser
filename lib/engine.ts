// Pure functions. Given the jobs, the settings and "today", work out every invoice,
// every reminder that would have gone out, and the who-owes-what list.

import {
  DEMO_TODAY,
  MAX_REMINDERS,
  PAYMENT_TERMS_DAYS,
  REMINDERS,
  REPEAT_EVERY_DAYS,
  SUBJECTS,
  TRADE,
  type Ledger,
  type SeedJob,
  type Tone,
} from "./content";

export type Job = SeedJob & { paidDay?: number }; // paidDay = scrub day the owner pressed Paid

export type Settings = {
  ledger: Ledger;
  tone: Tone;
  firstReminderDays: 7 | 14 | 21;
  threshold: number;
  day: number; // scrub, 0 = 12 Oct 2026
};

export type Reminder = {
  n: 1 | 2 | 3;
  day: number; // scrub day it goes out
  subject: string;
  body: string;
};

export type Invoice = {
  job: Job;
  number: string;
  issuedDay: number;
  dueDay: number;
  paidDay?: number;
  reminders: Reminder[]; // only the ones that have gone out by today
  nextReminderDay?: number;
  daysOverdue: number; // negative = not yet due
  needsYou?: "over the threshold" | "three reminders sent";
  status: "paid" | "due" | "overdue" | "needs you";
};

const MS_DAY = 86_400_000;

export function dayOf(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - DEMO_TODAY.getTime()) / MS_DAY);
}

export function dateOfDay(day: number): Date {
  return new Date(DEMO_TODAY.getTime() + day * MS_DAY);
}

export function fmtDate(day: number): string {
  return dateOfDay(day).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function fmtMoney(n: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: n % 1 ? 2 : 0 }).format(n);
}

export function invoiceNumber(ledger: Ledger, index: number): string {
  return ledger === "xero" ? `INV-${String(41 + index).padStart(4, "0")}` : String(1041 + index);
}

function fill(t: string, v: Record<string, string>): string {
  return t.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");
}

export function buildInvoices(jobs: Job[], s: Settings): Invoice[] {
  const done = jobs.filter((j) => j.done && j.amount > 0);
  return done.map((job, i) => {
    const issuedDay = dayOf(job.finished);
    const dueDay = issuedDay + PAYMENT_TERMS_DAYS;
    const paidDay = job.paidOn ? dayOf(job.paidOn) : job.paidDay;
    const number = invoiceNumber(s.ledger, i);
    const over = job.amount > s.threshold;

    const reminders: Reminder[] = [];
    let nextReminderDay: number | undefined;
    if (!over) {
      for (let n = 1 as 1 | 2 | 3; n <= MAX_REMINDERS; n = (n + 1) as 1 | 2 | 3) {
        const day = dueDay + s.firstReminderDays + (n - 1) * REPEAT_EVERY_DAYS;
        if (paidDay !== undefined && paidDay <= day) break;
        if (day > s.day) {
          nextReminderDay = day;
          break;
        }
        const vars = {
          name: job.customer.split(" ")[0],
          no: number,
          job: job.job.toLowerCase(),
          amount: fmtMoney(job.amount),
          due: fmtDate(dueDay),
          owner: TRADE.owner,
          trade: TRADE.name,
        };
        reminders.push({ n, day, subject: fill(SUBJECTS[s.tone][n - 1], vars), body: fill(REMINDERS[s.tone][n - 1], vars) });
      }
    }

    const isPaid = paidDay !== undefined && paidDay <= s.day;
    const daysOverdue = s.day - dueDay;
    let needsYou: Invoice["needsYou"];
    if (!isPaid && over) needsYou = "over the threshold";
    else if (!isPaid && reminders.length >= MAX_REMINDERS) needsYou = "three reminders sent";

    const status: Invoice["status"] = isPaid ? "paid" : needsYou ? "needs you" : daysOverdue > 0 ? "overdue" : "due";
    return { job, number, issuedDay, dueDay, paidDay: isPaid ? paidDay : undefined, reminders, nextReminderDay, daysOverdue, needsYou, status };
  });
}

export function owesList(invoices: Invoice[]) {
  const open = invoices.filter((i) => i.status !== "paid");
  const needsYou = open.filter((i) => i.needsYou);
  const chasing = open.filter((i) => !i.needsYou).sort((a, b) => b.daysOverdue - a.daysOverdue);
  const total = open.reduce((t, i) => t + i.job.amount, 0);
  return { needsYou, chasing, total };
}

// Paste from Excel / Sheets: tab-separated rows of customer, job, date, amount (any order of
// the last two is handled by looking for a number and a date).
export function parsePaste(text: string): SeedJob[] {
  const rows = text.split(/\r?\n/).map((r) => r.trim()).filter(Boolean);
  const out: SeedJob[] = [];
  for (const r of rows) {
    const cells = r.split(/\t|,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((c) => c.replace(/^"|"$/g, "").trim());
    if (cells.length < 3) continue;
    const amountCell = cells.find((c) => /^£?\s*[\d,]+(\.\d+)?$/.test(c));
    const dateCell = cells.find((c) => /\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}/.test(c));
    const rest = cells.filter((c) => c !== amountCell && c !== dateCell);
    if (!amountCell || rest.length < 1) continue;
    let finished = "2026-10-12";
    if (dateCell) {
      const m = dateCell.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
      finished = m ? `${m[3].length === 2 ? "20" + m[3] : m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : dateCell.slice(0, 10);
    }
    out.push({
      id: `p${Date.now()}${out.length}`,
      customer: rest[0],
      email: `${rest[0].toLowerCase().replace(/[^a-z]+/g, ".")}@example.com`,
      job: rest[1] ?? "Job",
      finished,
      amount: Number(amountCell.replace(/[£,\s]/g, "")),
      done: false,
    });
  }
  return out;
}
