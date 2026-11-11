import { useEffect, useState } from "react";
import { Modal, NumberInput, TextInput, Textarea, Loader } from "@mantine/core";
import { IconWallet, IconX, IconPlus, IconTrash, IconCheck, IconInfoCircle } from "@tabler/icons-react";
import { showNotification } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import axios from "axios";
import "../assets/css/AddInstallmentModal.css";

// ---------- helpers (outside the component) ----------
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const round2 = (n) => Math.round((num(n) + Number.EPSILON) * 100) / 100;
// Latin digits always, so the numbers match the amount field
const money = (n) => num(n).toLocaleString("en-US");
const EPS = 0.005;
const METHODS = ["Cash", "Bankak"]; // sent to the server exactly like this
const CLOSED_STATUSES = ["cancelled", "refunded"];

// stable keys for rows, so removing a row never shifts another row's state
let seq = 0;
const nextId = () => ++seq;
const emptyRow = () => ({ id: nextId(), method: "Cash", amount: "", transactionNumber: "" });

// two-option toggle for the payment method
function Seg({ label, options, value, onChange }) {
  return (
    <div className="aim-seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Used by both SaleInvoices and PurchaseInvoices. Props are unchanged; `currency` is optional.
const AddInstallmentModal = ({
  opened,
  setOpened,
  invoice, // full invoice object
  SUBMIT_URL,
  token,
  onSuccess,
  currency = "SDG",
}) => {
  const { t } = useTranslation();
  // every label falls back to its English text if a translation key is missing
  const tr = (key, defaultValue, vars) => t(key, { defaultValue, ...vars });

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState(() => [emptyRow()]);
  const [notes, setNotes] = useState("");

  // a fresh form every time the modal opens (or opens for another invoice)
  useEffect(() => {
    if (opened) {
      setRows([emptyRow()]);
      setNotes("");
    }
  }, [opened, invoice?._id]);

  // =========================
  // INVOICE NUMBERS (sale invoices have totalSalePrice, purchase invoices totalOrderPrice)
  // =========================

  const total = round2(invoice?.totalSalePrice ?? invoice?.totalOrderPrice);
  const paid = round2(invoice?.paidAmount);
  const hasRemaining =
    invoice?.remainingAmount !== undefined &&
    invoice?.remainingAmount !== null &&
    Number.isFinite(Number(invoice.remainingAmount));
  const remaining = hasRemaining ? round2(invoice.remainingAmount) : round2(total - paid);

  const closed = CLOSED_STATUSES.includes(invoice?.status);
  const fullyPaid = !closed && !!invoice && remaining <= EPS;
  const blocked = closed || fullyPaid; // nothing to collect: show the notice instead of the form

  const statusKey = closed ? invoice.status : fullyPaid ? "paid" : paid > EPS ? "partial" : "unpaid";
  const STATUS_UI = {
    paid: { cls: "aim-pill aim-pill--ok", label: tr("INSTALLMENT-STATUS-PAID", "Fully paid"), check: true },
    partial: { cls: "aim-pill", label: tr("INSTALLMENT-STATUS-PARTIAL", "Partially paid") },
    unpaid: { cls: "aim-pill aim-pill--none", label: tr("INSTALLMENT-STATUS-UNPAID", "Unpaid") },
    cancelled: { cls: "aim-pill aim-pill--none", label: tr("INSTALLMENT-STATUS-CANCELLED", "Cancelled") },
    refunded: { cls: "aim-pill aim-pill--none", label: tr("INSTALLMENT-STATUS-REFUNDED", "Refunded") },
  };
  const status = STATUS_UI[statusKey] ?? STATUS_UI.unpaid;
  const percent = total > EPS ? Math.min(100, Math.max(0, (paid / total) * 100)) : 0;

  // =========================
  // PAYMENT ROWS (each row is one transaction; immutable updates)
  // =========================

  const updateRow = (id, patch) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (id) => setRows((prev) => prev.filter((r) => r.id !== id));

  const totalAmount = round2(rows.reduce((s, r) => s + num(r.amount), 0));
  const remainingAfter = round2(remaining - totalAmount);

  // makes the payments add up to exactly the remaining balance (fills the last row)
  const payFull = () =>
    setRows((prev) => {
      if (prev.length === 0) return [{ ...emptyRow(), amount: remaining }];
      const last = prev[prev.length - 1];
      const others = prev.slice(0, -1).reduce((s, r) => s + num(r.amount), 0);
      return [...prev.slice(0, -1), { ...last, amount: Math.max(0, round2(remaining - others)) }];
    });

  // =========================
  // SUBMIT
  // =========================

  const close = () => {
    if (!loading) setOpened(false);
  };

  const validate = () => {
    if (!(totalAmount > 0)) {
      return tr("INSTALLMENT-ERR-AMOUNT", "Enter a payment amount greater than zero.");
    }
    if (remainingAfter < -EPS) {
      return tr("INSTALLMENT-ERR-EXCEEDS", "The payment exceeds the remaining balance.");
    }
    for (const r of rows) {
      if (num(r.amount) > 0 && r.method === "Bankak" && !String(r.transactionNumber).trim()) {
        return tr("INSTALLMENT-ERR-BANKAK", "Enter the Bankak transaction number.");
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Enter in a field submits the form
    if (loading) return;

    const problem = validate();
    if (problem) {
      showNotification({
        title: tr("INSTALLMENT-CHECK-TITLE", "Check the payment"),
        message: problem,
        color: "red",
      });
      return;
    }

    try {
      setLoading(true);

      // same payload shape the endpoints already receive
      const transactions = rows
        .filter((r) => num(r.amount) > 0)
        .map((r) => ({
          amount: round2(r.amount),
          method: r.method,
          transactionNumber: r.method === "Bankak" ? String(r.transactionNumber).trim() : "",
        }));

      const payload = {
        payment: {
          totalAmount: round2(transactions.reduce((s, x) => s + x.amount, 0)),
          transactions,
          notes,
        },
      };

      const res = await axios.post(SUBMIT_URL, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showNotification({
        title: tr("INSTALLMENT-OK-TITLE", "Success"),
        message: tr("INSTALLMENT-OK-TEXT", "Installment added successfully"),
        color: "green",
      });

      onSuccess?.(res.data.invoice);
      setOpened(false);
    } catch (err) {
      const d = err.response?.data;
      showNotification({
        title: tr("INSTALLMENT-ERR-TITLE", "Error"),
        message: String(d?.message || d?.error || err.message || "Something went wrong."),
        color: "red",
      });
      // the modal stays open so nothing typed is lost
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // UI
  // =========================

  const summaryCard = (
    <div className="aim-card">
      <div className="aim-card-top">
        <span className="aim-inv">
          {tr("INSTALLMENT-INVOICE", "Invoice")} <bdi dir="ltr">{invoice?.invoiceID ?? "—"}</bdi>
        </span>
        <span className={status.cls}>
          {status.check && <IconCheck size={14} stroke={2.2} aria-hidden="true" />}
          {status.label}
        </span>
      </div>

      <div
        className="aim-track"
        role="progressbar"
        aria-label={tr("INSTALLMENT-PROGRESS", "Payment progress")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
      >
        <div className={`aim-fill${fullyPaid ? " aim-fill--ok" : ""}`} style={{ width: `${percent}%` }} />
      </div>

      <div className="aim-stats">
        <div>
          <div className="aim-k">{tr("INSTALLMENT-TOTAL", "Total")}</div>
          <div className="aim-v">
            <bdi dir="ltr">
              {money(total)} <small>{currency}</small>
            </bdi>
          </div>
        </div>
        <div>
          <div className="aim-k">{tr("INSTALLMENT-PAID", "Paid")}</div>
          <div className="aim-v">
            <bdi dir="ltr">
              {money(paid)} <small>{currency}</small>
            </bdi>
          </div>
        </div>
        <div>
          <div className="aim-k">{tr("INSTALLMENT-REMAINING", "Remaining")}</div>
          <div className={`aim-v aim-v--rem${remaining <= EPS ? " is-zero" : ""}`}>
            <bdi dir="ltr">
              {money(Math.max(0, remaining))} <small>{currency}</small>
            </bdi>
          </div>
        </div>
      </div>
    </div>
  );

  const dueClass =
    remainingAfter < -EPS ? "aim-due aim-due--over" : Math.abs(remainingAfter) <= EPS ? "aim-due aim-due--ok" : "aim-due";

  return (
    <Modal.Root
      opened={opened}
      onClose={close}
      size={520}
      padding={0}
      radius={12}
      centered
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
    >
      <Modal.Overlay backgroundOpacity={0.55} />
      <Modal.Content className="aim-content">
        {/* ============ header ============ */}
        <div className="aim-head">
          <span className="aim-badge">
            <IconWallet size={22} stroke={1.8} aria-hidden="true" />
          </span>
          <div className="aim-titles">
            <Modal.Title className="aim-title">{tr("INSTALLMENT-TITLE", "Add installment")}</Modal.Title>
            <p className="aim-sub">{tr("INSTALLMENT-SUBTITLE", "Record a payment on this invoice.")}</p>
          </div>
          <button
            type="button"
            className="aim-close"
            aria-label={tr("INSTALLMENT-CLOSE", "Close")}
            onClick={close}
            disabled={loading}
          >
            <IconX size={20} stroke={2} aria-hidden="true" />
          </button>
        </div>

        {blocked ? (
          /* ============ nothing to collect: fully paid, cancelled or refunded ============ */
          <>
            <Modal.Body className="aim-body">
              {summaryCard}
              <div className={`aim-note${closed ? " aim-note--stop" : ""}`} role="status">
                <IconInfoCircle size={20} stroke={2} aria-hidden="true" />
                <div>
                  <div className="aim-note-title">
                    {closed
                      ? tr("INSTALLMENT-CLOSED-TITLE", "No installment can be added")
                      : tr("INSTALLMENT-PAID-TITLE", "This invoice is fully paid")}
                  </div>
                  <div className="aim-note-text">
                    {closed
                      ? tr("INSTALLMENT-CLOSED-TEXT", "A cancelled or refunded invoice can’t receive payments.")
                      : tr(
                          "INSTALLMENT-PAID-TEXT",
                          "There’s no remaining balance to collect, so no installment can be added."
                        )}
                  </div>
                </div>
              </div>
            </Modal.Body>
            <div className="aim-foot">
              <button type="button" className="aim-btn" onClick={close} data-autofocus>
                {tr("INSTALLMENT-CLOSE", "Close")}
              </button>
            </div>
          </>
        ) : (
          /* ============ payment form ============ */
          <form className="aim-form" onSubmit={handleSubmit} noValidate>
            <Modal.Body className="aim-body">
              {summaryCard}

              <div className="aim-sec">
                <div className="aim-sec-head">
                  <h2 className="aim-h">{tr("INSTALLMENT-PAYMENTS", "Payments")}</h2>
                  <button type="button" className="aim-btn aim-txt" onClick={addRow} disabled={loading}>
                    <IconPlus size={16} stroke={2} aria-hidden="true" />
                    {tr("INSTALLMENT-ADD-PAYMENT", "Add payment")}
                  </button>
                </div>

                {rows.length === 0 ? (
                  <div className="aim-empty">{tr("INSTALLMENT-EMPTY", "Add a payment to continue.")}</div>
                ) : (
                  <>
                    <div className="aim-labels" aria-hidden="true">
                      <span>{tr("INSTALLMENT-METHOD", "Method")}</span>
                      <span>{tr("INSTALLMENT-AMOUNT", "Amount")}</span>
                      <span />
                    </div>

                    <div className="aim-rows">
                      {rows.map((r, i) => (
                        <div className="aim-row" key={r.id}>
                          <Seg
                            label={tr("INSTALLMENT-METHOD", "Method")}
                            options={[
                              { value: "Cash", label: tr("INSTALLMENT-METHOD-CASH", "Cash") },
                              { value: "Bankak", label: tr("INSTALLMENT-METHOD-BANKAK", "Bankak") },
                            ]}
                            value={r.method}
                            onChange={(v) => updateRow(r.id, { method: v })}
                          />

                          <NumberInput
                            className="aim-amt"
                            hideControls
                            aria-label={tr("INSTALLMENT-AMOUNT", "Amount")}
                            placeholder="0"
                            value={r.amount}
                            onChange={(v) => updateRow(r.id, { amount: v })}
                            min={0}
                            decimalScale={2}
                            thousandSeparator=","
                            allowNegative={false}
                            rightSection={currency}
                            rightSectionWidth={Math.max(52, String(currency).length * 9 + 26)}
                            rightSectionPointerEvents="none"
                            data-autofocus={i === 0 ? true : undefined}
                          />

                          <button
                            type="button"
                            className="aim-ib"
                            aria-label={tr("INSTALLMENT-REMOVE", "Remove payment")}
                            onClick={() => removeRow(r.id)}
                            disabled={loading}
                          >
                            <IconTrash size={18} stroke={2} aria-hidden="true" />
                          </button>

                          {r.method === "Bankak" && (
                            <TextInput
                              className="aim-txn"
                              aria-label={tr("INSTALLMENT-TRANSACTION", "Transaction number")}
                              placeholder={tr("INSTALLMENT-TRANSACTION", "Transaction number")}
                              value={r.transactionNumber}
                              onChange={(e) => updateRow(r.id, { transactionNumber: e.currentTarget.value })}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    {Math.abs(totalAmount - remaining) > EPS && (
                      <button type="button" className="aim-chip" onClick={payFull} disabled={loading}>
                        {tr("INSTALLMENT-PAY-REMAINING", "Pay full remaining · {{amount}} {{currency}}", {
                          amount: money(remaining),
                          currency,
                        })}
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="aim-sum">
                <div>
                  <div className="aim-k">{tr("INSTALLMENT-TOTAL-PAYMENT", "Total payment")}</div>
                  <div className="aim-sum-v">
                    <bdi dir="ltr">
                      {money(totalAmount)} {currency}
                    </bdi>
                  </div>
                </div>
                <div>
                  <div className="aim-k">{tr("INSTALLMENT-REMAINING-AFTER", "Remaining after")}</div>
                  <span className={dueClass}>
                    <bdi dir="ltr">
                      {remainingAfter < -EPS ? "−" : ""}
                      {money(Math.abs(remainingAfter))} {currency}
                    </bdi>
                  </span>
                </div>
              </div>

              <div>
                <span className="aim-lb">
                  {tr("INSTALLMENT-NOTES", "Notes")}
                  <span className="aim-opt"> · {tr("INSTALLMENT-OPTIONAL", "Optional")}</span>
                </span>
                <Textarea
                  aria-label={tr("INSTALLMENT-NOTES", "Notes")}
                  value={notes}
                  onChange={(e) => setNotes(e.currentTarget.value)}
                />
              </div>
            </Modal.Body>

            <div className="aim-foot">
              <button type="button" className="aim-btn" onClick={close} disabled={loading}>
                {tr("CANCEL", "Cancel")}
              </button>
              <button type="submit" className="aim-btn aim-pri" disabled={loading}>
                {loading && <Loader size={16} color="white" />}
                {tr("INSTALLMENT-SUBMIT", "Add installment")}
              </button>
            </div>
          </form>
        )}
      </Modal.Content>
    </Modal.Root>
  );
};

export default AddInstallmentModal;