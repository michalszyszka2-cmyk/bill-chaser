"use client";

import { useMemo, useState } from "react";
import { CAPTIONS, LEDGER_LABEL, SEED_JOBS, TRADE, type Ledger, type Tone } from "@/lib/content";
import {
  buildInvoices,
  fmtDate,
  fmtMoney,
  owesList,
  parsePaste,
  type Invoice,
  type Job,
  type Settings,
} from "@/lib/engine";

const DEFAULTS: Settings = { ledger: "xero", tone: "gentle", firstReminderDays: 7, threshold: 500, day: 0 };

function cap(t: string, ledger: Ledger) {
  return t.replaceAll("{ledger}", LEDGER_LABEL[ledger]);
}

export default function Demo() {
  const [jobs, setJobs] = useState<Job[]>(() => SEED_JOBS.map((j) => ({ ...j })));
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [selectedId, setSelectedId] = useState<string>("j1");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const invoices = useMemo(() => buildInvoices(jobs, s), [jobs, s]);
  const byJob = useMemo(() => new Map(invoices.map((i) => [i.job.id, i])), [invoices]);
  const selected = byJob.get(selectedId) ?? invoices.find((i) => i.status !== "paid") ?? invoices[0];
  const list = useMemo(() => owesList(invoices), [invoices]);

  const set = (patch: Partial<Settings>) => setS((p) => ({ ...p, ...patch }));
  const updateJob = (id: string, patch: Partial<Job>) =>
    setJobs((js) => js.map((j) => (j.id === id ? { ...j, ...patch } : j)));

  const toggleDone = (j: Job) => {
    updateJob(j.id, { done: !j.done });
    if (!j.done) setSelectedId(j.id);
  };
  const markPaid = (inv: Invoice) => updateJob(inv.job.id, { paidDay: s.day, paidOn: undefined });
  const addRow = () => {
    const id = `n${Date.now()}`;
    setJobs((js) => [...js, { id, customer: "", email: "", job: "", finished: fmtIso(s.day), amount: 0, done: false }]);
  };
  const applyPaste = (text: string) => {
    const rows = parsePaste(text);
    if (rows.length) setJobs((js) => [...js, ...rows]);
    setPasteText("");
    setPasteOpen(false);
  };
  // One-column layouts (phones, tablets): the invoice and inbox aren't beside the lists, so take the reader there.
  const jumpTo = (id: string) => {
    if (window.matchMedia("(max-width: 1023px)").matches)
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const showInbox = (jobId: string) => {
    setSelectedId(jobId);
    jumpTo("inbox");
  };
  const reset = () => {
    setJobs(SEED_JOBS.map((j) => ({ ...j })));
    setS(DEFAULTS);
    setSelectedId("j1");
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-32 sm:px-6 sm:pb-16">
      <header className="pt-10 pb-6 sm:pt-14">
        <p className="text-sm text-ink-soft">Quietside · a working demo</p>
        <h1 className="mt-2 text-4xl leading-[1.05] sm:text-5xl">The bill chaser</h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-soft">
          Job done, invoice written, polite reminders, paid. Try it as {TRADE.name}, {TRADE.town}. Nothing here is sent
          or saved.
        </p>
      </header>

      {/* control bar */}
      <div className="card z-10 mb-6 sm:sticky sm:top-2 flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-sm text-ink-soft">My books are in</span>
          {(["xero", "quickbooks"] as Ledger[]).map((l) => (
            <button key={l} className={`btn ${s.ledger === l ? "btn-on" : ""}`} onClick={() => set({ ledger: l })}>
              {LEDGER_LABEL[l]}
            </button>
          ))}
        </div>
        <label className="hidden min-w-[240px] flex-1 items-center gap-3 sm:flex">
          <span className="whitespace-nowrap text-sm text-ink-soft">
            Today <strong className="font-medium text-ink">{fmtDate(s.day)}</strong>
            {s.day > 0 && <span className="text-ink-faint"> (+{s.day} days)</span>}
          </span>
          <input
            type="range"
            min={0}
            max={60}
            value={s.day}
            aria-label="Move time forward"
            onChange={(e) => set({ day: Number(e.target.value) })}
          />
        </label>
        <button className="btn" onClick={reset}>
          Reset
        </button>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[1.15fr_1fr]">
        {/* LEFT (below lg the two columns dissolve so the sections run 1-5) */}
        <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-6">
          <section className="card order-1 min-w-0 p-5 lg:order-none">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-2xl">1. Jobs</h2>
              <div className="flex gap-2">
                <button className="btn" onClick={addRow}>
                  + Add a job
                </button>
                <button className="btn" onClick={() => setPasteOpen((o) => !o)}>
                  Paste from Excel
                </button>
              </div>
            </div>
            <p className="caption mt-2">{CAPTIONS.jobs}</p>
            {pasteOpen && (
              <div className="mt-3">
                <textarea
                  className="cell h-24 w-full border-line bg-white font-mono text-base sm:text-sm"
                  placeholder={"Customer\tJob\tDate finished\tAmount\nJo Bloggs\tLeaking cistern\t2026-10-08\t140"}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  onPaste={(e) => {
                    const t = e.clipboardData.getData("text");
                    if (t.includes("\t") || t.includes("\n")) {
                      e.preventDefault();
                      applyPaste(t);
                    }
                  }}
                />
                <div className="mt-2 flex gap-2">
                  <button className="btn btn-primary" onClick={() => applyPaste(pasteText)}>
                    Add these rows
                  </button>
                  <button className="btn" onClick={() => setPasteOpen(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <ul className="mt-4 flex flex-col gap-3 sm:hidden">
              {jobs.map((j) => {
                const inv = byJob.get(j.id);
                const isSel = inv && selected?.job.id === j.id;
                return (
                  <li
                    key={j.id}
                    className={`rounded-xl border p-3 ${isSel ? "border-clay bg-paper-tint/60" : "border-line"}`}
                    onClick={() => inv && setSelectedId(j.id)}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        className="tick tick-lg"
                        data-on={j.done}
                        aria-label={j.done ? "Mark not done" : "Mark done"}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDone(j);
                        }}
                      >
                        {j.done && (
                          <svg width="18" height="18" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M2.5 7.5l3 3 6-7" />
                          </svg>
                        )}
                      </button>
                      <input className="cell cell-m font-medium" value={j.customer} placeholder="Customer" aria-label="Customer" onChange={(e) => updateJob(j.id, { customer: e.target.value })} />
                      <span className="flex flex-none items-center gap-1">
                        <span className="text-ink-faint">£</span>
                        <input
                          className="cell cell-m cell-amt text-right"
                          type="number"
                          inputMode="decimal"
                          min={0}
                          value={j.amount || ""}
                          placeholder="0"
                          aria-label="Amount"
                          onChange={(e) => updateJob(j.id, { amount: Number(e.target.value) })}
                        />
                      </span>
                    </div>
                    <input className="cell cell-m mt-2" value={j.job} placeholder="What you did" aria-label="What you did" onChange={(e) => updateJob(j.id, { job: e.target.value })} />
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <input className="cell cell-m cell-date" type="date" aria-label="Date finished" value={j.finished} onChange={(e) => e.target.value && updateJob(j.id, { finished: e.target.value })} />
                      {inv ? <StatusPill inv={inv} /> : <span className="text-sm text-ink-faint">not done yet</span>}
                    </div>
                    {isSel && (
                      <a
                        href="#invoice"
                        className="mt-2 inline-block text-sm text-clay-deep underline underline-offset-2"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById("invoice")?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                      >
                        See its invoice ↓
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="-mx-2 mt-4 hidden max-w-[calc(100%+1rem)] overflow-x-auto sm:block">
              <table className="w-full min-w-[560px] text-[0.95rem]">
                <thead className="text-left text-xs uppercase tracking-wide text-ink-faint">
                  <tr>
                    <th className="px-2 pb-2 font-medium">Done</th>
                    <th className="px-2 pb-2 font-medium">Customer</th>
                    <th className="px-2 pb-2 font-medium">Job</th>
                    <th className="px-2 pb-2 font-medium">Finished</th>
                    <th className="px-2 pb-2 text-right font-medium">Amount</th>
                    <th className="px-2 pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j) => {
                    const inv = byJob.get(j.id);
                    const isSel = inv && selected?.job.id === j.id;
                    return (
                      <tr
                        key={j.id}
                        className={`border-t border-line ${isSel ? "bg-paper-tint/60" : ""} ${inv ? "cursor-pointer" : ""}`}
                        onClick={() => inv && setSelectedId(j.id)}
                      >
                        <td className="px-2 py-1.5">
                          <button
                            className="tick"
                            data-on={j.done}
                            aria-label={j.done ? "Mark not done" : "Mark done"}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDone(j);
                            }}
                          >
                            {j.done && (
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <path d="M2.5 7.5l3 3 6-7" />
                              </svg>
                            )}
                          </button>
                        </td>
                        <td className="px-1 py-1">
                          <input className="cell" value={j.customer} placeholder="Customer" onChange={(e) => updateJob(j.id, { customer: e.target.value })} />
                        </td>
                        <td className="px-1 py-1">
                          <input className="cell" value={j.job} placeholder="What you did" onChange={(e) => updateJob(j.id, { job: e.target.value })} />
                        </td>
                        <td className="px-1 py-1">
                          <input className="cell" type="date" value={j.finished} onChange={(e) => e.target.value && updateJob(j.id, { finished: e.target.value })} />
                        </td>
                        <td className="px-1 py-1">
                          <div className="flex items-center justify-end">
                            <span className="text-ink-faint">£</span>
                            <input
                              className="cell w-24 text-right"
                              type="number"
                              min={0}
                              value={j.amount || ""}
                              placeholder="0"
                              onChange={(e) => updateJob(j.id, { amount: Number(e.target.value) })}
                            />
                          </div>
                        </td>
                        <td className="px-2 py-1">{inv ? <StatusPill inv={inv} /> : <span className="text-sm text-ink-faint">not done yet</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card order-3 min-w-0 p-5 lg:order-none">
            <h2 className="text-2xl">3. How to chase</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-sm text-ink-soft">First reminder, after the due date</p>
                <div className="mt-2 flex gap-2">
                  {([7, 14, 21] as const).map((d) => (
                    <button key={d} className={`btn ${s.firstReminderDays === d ? "btn-on" : ""}`} onClick={() => set({ firstReminderDays: d })}>
                      {d} days
                    </button>
                  ))}
                </div>
                <p className="caption mt-2">Then every 7 days, three at most. After that it waits for you.</p>
              </div>
              <div>
                <p className="text-sm text-ink-soft">Tone</p>
                <div className="mt-2 flex gap-2">
                  {(["gentle", "firm"] as Tone[]).map((t) => (
                    <button key={t} className={`btn ${s.tone === t ? "btn-on" : ""}`} onClick={() => set({ tone: t })}>
                      {t[0].toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm text-ink-soft">Never chase automatically above</p>
                  <span className="display text-xl">{fmtMoney(s.threshold)}</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={3000}
                  step={50}
                  value={s.threshold}
                  aria-label="Threshold"
                  onChange={(e) => set({ threshold: Number(e.target.value) })}
                />
                <p className="caption">Bigger invoices deserve a phone call, not a template. They go on your list instead.</p>
              </div>
            </div>
          </section>

          <section className="card order-5 min-w-0 p-5 lg:order-none">
            <div className="flex items-baseline justify-between">
              <h2 className="text-2xl">5. Who owes what</h2>
              <span className="text-sm text-ink-soft">
                owed <strong className="display text-lg text-ink">{fmtMoney(list.total)}</strong>
              </span>
            </div>
            <p className="caption mt-2">{CAPTIONS.list}</p>
            {list.needsYou.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-clay-deep">Needs you</p>
                <ul className="mt-1 divide-y divide-line">
                  {list.needsYou.map((i) => (
                    <OwesRow key={i.number} inv={i} onSelect={() => showInbox(i.job.id)} note={i.needsYou} />
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Being chased for you</p>
              {list.chasing.length === 0 ? (
                <p className="mt-2 text-sm text-ink-soft">{list.needsYou.length ? "Nothing on autopilot right now." : "Nothing. Everyone has paid."}</p>
              ) : (
                <ul className="mt-1 divide-y divide-line">
                  {list.chasing.map((i) => (
                    <OwesRow
                      key={i.number}
                      inv={i}
                      onSelect={() => showInbox(i.job.id)}
                      note={
                        i.daysOverdue > 0
                          ? `${i.daysOverdue} day${i.daysOverdue === 1 ? "" : "s"} overdue · ${i.reminders.length} reminder${i.reminders.length === 1 ? "" : "s"} sent`
                          : `due in ${-i.daysOverdue} day${i.daysOverdue === -1 ? "" : "s"}`
                      }
                    />
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT */}
        <div className="contents lg:sticky lg:top-24 lg:flex lg:min-w-0 lg:flex-col lg:gap-6 lg:self-start">
          <section id="invoice" className="card order-2 min-w-0 scroll-mt-4 p-5 lg:order-none">
            <h2 className="text-2xl">2. The invoice</h2>
            <p className="caption mt-2">{cap(CAPTIONS.invoice, s.ledger)}</p>
            {selected ? <InvoiceCard inv={selected} ledger={s.ledger} /> : <p className="mt-4 text-sm text-ink-soft">Tick a job as done to see its invoice.</p>}
          </section>

          <section id="inbox" className="card order-4 min-w-0 scroll-mt-4 p-5 lg:order-none">
            <h2 className="text-2xl">4. What the customer sees</h2>
            <p className="caption mt-2">{CAPTIONS.inbox}</p>
            {selected && <Inbox inv={selected} day={s.day} threshold={s.threshold} onPaid={() => markPaid(selected)} ledger={s.ledger} />}
          </section>
        </div>
      </div>

      {/* phones: time stays under the thumb while you read the inbox */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 px-4 pt-2 pb-3 backdrop-blur sm:hidden">
        <label className="block">
          <span className="flex items-baseline justify-between text-sm text-ink-soft">
            <span>
              Today <strong className="font-medium text-ink">{fmtDate(s.day)}</strong>
            </span>
            <span className="text-ink-faint">{s.day > 0 ? `+${s.day} days` : "slide to move time"}</span>
          </span>
          <input
            type="range"
            min={0}
            max={60}
            value={s.day}
            aria-label="Move time forward"
            className="range-lg mt-1"
            onChange={(e) => set({ day: Number(e.target.value) })}
          />
        </label>
      </div>

      <footer className="mt-12 max-w-3xl">
        <p className="caption">
          Quietside · <a className="underline underline-offset-2" href="https://quietside.co.uk/">quietside.co.uk</a>
        </p>
        <p className="caption mt-2">{CAPTIONS.footer}</p>
      </footer>
    </main>
  );
}

function fmtIso(day: number): string {
  const d = new Date(Date.UTC(2026, 9, 12) + day * 86_400_000);
  return d.toISOString().slice(0, 10);
}

function StatusPill({ inv }: { inv: Invoice }) {
  const map = { paid: ["pill-paid", "Paid"], due: ["pill-due", "Sent, not due yet"], overdue: ["pill-overdue", "Overdue"], "needs you": ["pill-needs", "Needs you"] } as const;
  const [cls, label] = map[inv.status];
  return <span className={`pill ${cls}`}>{label}</span>;
}

function OwesRow({ inv, note, onSelect }: { inv: Invoice; note?: string; onSelect: () => void }) {
  return (
    <li className="flex cursor-pointer items-center justify-between gap-3 py-2 hover:bg-paper-tint/50" onClick={onSelect}>
      <div className="min-w-0">
        <p className="truncate font-medium">{inv.job.customer || "Unnamed"}</p>
        <p className="truncate text-sm text-ink-soft">
          {inv.number} · {note}
        </p>
      </div>
      <span className="display text-lg">{fmtMoney(inv.job.amount)}</span>
    </li>
  );
}

function InvoiceCard({ inv, ledger }: { inv: Invoice; ledger: Ledger }) {
  const j = inv.job;
  const vat = 0; // the sample trade is below the VAT threshold; keeps tax out of the demo
  if (ledger === "xero") {
    return (
      <div className="inv-xero arrive mt-4 rounded-xl border border-line bg-white p-5" key={inv.number + ledger}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="inv-title">Invoice</p>
            <p className="mt-1 text-sm text-ink-soft">{TRADE.name}</p>
            <p className="text-sm text-ink-soft">{TRADE.town}</p>
          </div>
          <div className="text-right text-sm">
            <p className="text-ink-faint">Invoice number</p>
            <p className="font-medium">{inv.number}</p>
            <p className="mt-2 text-ink-faint">Invoice date</p>
            <p className="font-medium">{fmtDate(inv.issuedDay)}</p>
            <p className="mt-2 text-ink-faint">Due date</p>
            <p className="font-medium">{fmtDate(inv.dueDay)}</p>
          </div>
        </div>
        <p className="mt-5 text-xs uppercase tracking-wide text-ink-faint">To</p>
        <p className="font-medium">{j.customer || "Customer"}</p>
        <table className="mt-5 w-full text-sm">
          <thead className="border-b border-ink text-left text-xs uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="py-1 font-medium">Description</th>
              <th className="py-1 text-right font-medium">Qty</th>
              <th className="py-1 text-right font-medium">Amount GBP</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-line">
              <td className="py-2">{j.job || "Work done"}</td>
              <td className="py-2 text-right">1</td>
              <td className="py-2 text-right">{fmtMoney(j.amount)}</td>
            </tr>
          </tbody>
        </table>
        <div className="mt-3 ml-auto w-48 text-sm">
          <div className="flex justify-between py-0.5 text-ink-soft">
            <span>Subtotal</span>
            <span>{fmtMoney(j.amount)}</span>
          </div>
          <div className="flex justify-between py-0.5 text-ink-soft">
            <span>VAT</span>
            <span>{fmtMoney(vat)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-ink py-1 font-semibold">
            <span>Total GBP</span>
            <span>{fmtMoney(j.amount)}</span>
          </div>
          {inv.paidDay !== undefined && (
            <div className="flex justify-between py-0.5 text-moss">
              <span>Paid {fmtDate(inv.paidDay)}</span>
              <span>{fmtMoney(j.amount)}</span>
            </div>
          )}
          <div className="flex justify-between py-0.5 font-semibold">
            <span>Amount due</span>
            <span>{fmtMoney(inv.paidDay !== undefined ? 0 : j.amount)}</span>
          </div>
        </div>
        <p className="mt-5 text-xs text-ink-soft">
          Bank transfer to {TRADE.name}, sort code {TRADE.sort}, account {TRADE.account}. Please quote {inv.number}.
        </p>
      </div>
    );
  }
  return (
    <div className="inv-qbo arrive mt-4 overflow-hidden rounded-xl border border-line bg-white" key={inv.number + ledger}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold">{TRADE.name}</p>
            <p className="text-sm text-ink-soft">{TRADE.town}</p>
          </div>
          <div className="text-right">
            <p className="inv-title">INVOICE</p>
            <p className="text-sm text-ink-soft">Invoice no. {inv.number}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-faint">Bill to</p>
            <p className="font-medium">{j.customer || "Customer"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-faint">Invoice date</p>
            <p className="font-medium">{fmtDate(inv.issuedDay)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-faint">Due date</p>
            <p className="font-medium">{fmtDate(inv.dueDay)}</p>
          </div>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead className="inv-band text-left text-xs uppercase tracking-wide text-ink-soft">
          <tr>
            <th className="px-5 py-2 font-medium">Activity</th>
            <th className="px-5 py-2 text-right font-medium">Qty</th>
            <th className="hidden px-5 py-2 text-right font-medium sm:table-cell">Rate</th>
            <th className="px-5 py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="px-5 py-2">{j.job || "Work done"}</td>
            <td className="px-5 py-2 text-right">1</td>
            <td className="hidden px-5 py-2 text-right sm:table-cell">{fmtMoney(j.amount)}</td>
            <td className="px-5 py-2 text-right">{fmtMoney(j.amount)}</td>
          </tr>
        </tbody>
      </table>
      <div className="p-5 pt-2">
        <div className="ml-auto w-48 text-sm">
          <div className="flex justify-between py-0.5 text-ink-soft">
            <span>Subtotal</span>
            <span>{fmtMoney(j.amount)}</span>
          </div>
          <div className="flex justify-between py-0.5 text-ink-soft">
            <span>Total</span>
            <span>{fmtMoney(j.amount)}</span>
          </div>
          {inv.paidDay !== undefined && (
            <div className="flex justify-between py-0.5 text-moss">
              <span>Payment {fmtDate(inv.paidDay)}</span>
              <span>-{fmtMoney(j.amount)}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between border-t border-ink py-1 text-base font-semibold">
            <span>Balance due</span>
            <span>{fmtMoney(inv.paidDay !== undefined ? 0 : j.amount)}</span>
          </div>
        </div>
        <p className="mt-4 text-xs text-ink-soft">
          Bank transfer to {TRADE.name}, sort code {TRADE.sort}, account {TRADE.account}. Please quote {inv.number}.
        </p>
      </div>
    </div>
  );
}

function Inbox({ inv, day, threshold, onPaid, ledger }: { inv: Invoice; day: number; threshold: number; onPaid: () => void; ledger: Ledger }) {
  const j = inv.job;
  const paid = inv.paidDay !== undefined;
  const first = j.customer.split(" ")[0] || "there";
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-line bg-paper-tint/40">
      <div className="flex items-center justify-between border-b border-line bg-white px-4 py-2 text-sm">
        <span className="text-ink-soft">
          Inbox of <strong className="font-medium text-ink">{j.customer || "the customer"}</strong>
        </span>
        <span className="text-xs text-ink-faint">{inv.reminders.length + 1} messages</span>
      </div>
      <ul className="divide-y divide-line">
        <Message key={`inv-${inv.number}`} from={TRADE.name} day={inv.issuedDay} subject={`Invoice ${inv.number} from ${TRADE.name}`}>
          Hi {first}, thanks for having me round. Invoice {inv.number} for the {j.job.toLowerCase() || "work"} is attached:{" "}
          {fmtMoney(j.amount)}, due {fmtDate(inv.dueDay)}. Bank details are on the invoice. {TRADE.owner}
        </Message>
        {inv.reminders.map((r) => (
          <Message key={`${inv.number}-r${r.n}`} from={TRADE.name} day={r.day} subject={r.subject} tag={`reminder ${r.n} of 3`}>
            {r.body}
          </Message>
        ))}
      </ul>
      <div className="border-t border-line bg-white px-4 py-3 text-sm">
        {paid ? (
          <p className="text-moss">
            Paid on {fmtDate(inv.paidDay!)}. Reminders stopped. <span className="text-ink-soft">{cap(CAPTIONS.paid, ledger)}</span>
          </p>
        ) : inv.needsYou === "over the threshold" ? (
          <p className="text-clay-deep">
            No reminders: {fmtMoney(j.amount)} is over your {fmtMoney(threshold)} line. This one waits for you.
          </p>
        ) : inv.needsYou === "three reminders sent" ? (
          <p className="text-clay-deep">Three reminders sent, still unpaid. It is on your list now.</p>
        ) : inv.nextReminderDay !== undefined ? (
          <p className="text-ink-soft">
            Next reminder {fmtDate(inv.nextReminderDay)} (in {inv.nextReminderDay - day} days). Move time forward to watch it arrive.
          </p>
        ) : null}
        {!paid && (
          <button className="btn btn-primary mt-3" onClick={onPaid}>
            Customer paid today
          </button>
        )}
      </div>
    </div>
  );
}

function Message({ from, day, subject, tag, children }: { from: string; day: number; subject: string; tag?: string; children: React.ReactNode }) {
  return (
    <li className="arrive bg-white px-4 py-3">
      <div className="flex items-baseline justify-between gap-3 text-xs text-ink-faint">
        <span>
          <span className="whitespace-nowrap">{from}</span>
          {tag && <span className="ml-2 whitespace-nowrap rounded-full bg-paper-tint px-2 py-0.5 text-ink-soft">{tag}</span>}
        </span>
        <span className="whitespace-nowrap">{fmtDate(day)}</span>
      </div>
      <p className="mt-1 text-sm font-medium">{subject}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink-soft">{children}</p>
    </li>
  );
}
