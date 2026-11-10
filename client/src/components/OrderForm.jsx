import { useState, useMemo } from "react";
import { Modal, Select, NumberInput, TextInput, Textarea, Loader } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconTruck, IconX, IconPlus, IconMinus, IconTrash, IconCalendar } from "@tabler/icons-react";
import { showNotification } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { stockParts } from "../utils/units";
import "../assets/css/CreateSaleInvoiceModal.css"; // shared invoice-modal design
import "../assets/css/OrderForm.css"; // purchase-order variant (orange accent, header)

// ---------- helpers (outside the component) ----------
const idOf = (u) => String(u?._id ?? u ?? "");
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const round3 = (n) => Math.round(Number(n) * 1000) / 1000;
const toBaseQty = (qty, factor) => Math.round(qty * factor * 1e6) / 1e6;
const money = (n) => Number(n || 0).toLocaleString();

// a Date, or null when the value is empty or not a valid date (works for Date or string)
const toDate = (d) => {
  if (!d) return null;
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? null : x;
};
const toIso = (d) => toDate(d)?.toISOString();

// Mantine's Select throws on duplicate or empty option values, so every list goes through this
const uniqueOptions = (options) => {
  const seen = new Set();
  return options.filter((o) => o.value && !seen.has(o.value) && seen.add(o.value));
};

// stable keys for rows, so removing a row never shifts another row's state
let seq = 0;
const nextId = () => ++seq;

const emptyLine = () => ({ id: nextId(), product: "", unit: "", quantity: 1, unitPurchasePrice: 0 });
const emptyPayment = () => ({ id: nextId(), method: "Cash", amount: 0, transactionNumber: "", notes: "" });
const initialForm = () => ({
  vendor: "",
  products: [emptyLine()],
  paymentType: "later",
  payments: [],
  orderDate: null,
  deliveryDate: null,
  notes: "",
});

const METHODS = ["Cash", "Bankak"];

const Req = () => (
  <span className="of-req" aria-hidden="true">
    {" "}
    *
  </span>
);

// two-option toggle used for the payment method
function Seg({ label, options, value, onChange }) {
  return (
    <div className="csi-seg" role="group" aria-label={label}>
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

const OrderForm = ({
  opened,
  setOpened,
  suppliers,
  inventoryData,
  setInventoryData,
  setOrdersData,
  currency = "SDG",
}) => {
  const [form, setForm] = useState(initialForm());
  const [submitting, setSubmitting] = useState(false);

  const { t } = useTranslation();
  // existing translation keys are reused; new keys fall back to the English default
  const tr = (key, defaultValue, vars) => t(key, { defaultValue, ...vars });

  const BASE_URL = import.meta.env.VITE_URL;

  const close = () => {
    if (!submitting) setOpened(false);
  };

  // =========================
  // LOOKUPS
  // =========================

  const supplierOptions = useMemo(
    () =>
      uniqueOptions(
        (suppliers ?? [])
          .map((s) => (typeof s === "string" ? { value: s, label: s } : s))
          .filter((s) => s?.value != null)
          .map((s) => ({ value: String(s.value), label: String(s.label ?? s.value) }))
      ),
    [suppliers]
  );

  const inventoryByProduct = useMemo(() => {
    const map = new Map();
    (inventoryData ?? []).forEach((i) => {
      if (i?.product?._id) map.set(String(i.product._id), i);
    });
    return map;
  }, [inventoryData]);

  // purchasing replenishes stock, so out-of-stock products stay selectable
  const productOptions = useMemo(
    () =>
      uniqueOptions(
        (inventoryData ?? [])
          .filter((i) => i?.product?._id) // skips unpopulated or orphaned rows
          .map((i) => ({ value: String(i.product._id), label: String(i.product.name ?? "Unnamed product") }))
      ),
    [inventoryData]
  );

  const levelOf = (productId, unitId) =>
    inventoryByProduct
      .get(String(productId))
      ?.product?.unitLevels?.find((l) => idOf(l.unit) === String(unitId));

  const unitOptionsFor = (productId) =>
    uniqueOptions(
      (inventoryByProduct.get(String(productId))?.product?.unitLevels ?? []).map((l) => ({
        value: idOf(l.unit),
        label: String(l.unit?.name ?? "Unit"),
      }))
    );

  // =========================
  // PRODUCT LINES (immutable updates)
  // =========================

  const updateLine = (id, patch) =>
    setForm((prev) => ({
      ...prev,
      products: prev.products.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));

  const handleProductChange = (id, productId) => {
    if (!productId) {
      updateLine(id, { product: "", unit: "", unitPurchasePrice: 0 });
      return;
    }
    const levels = inventoryByProduct.get(String(productId))?.product?.unitLevels ?? [];
    const base = levels.find((l) => l.factor === 1) ?? levels[0];
    updateLine(id, {
      product: productId,
      unit: base ? idOf(base.unit) : "",
      unitPurchasePrice: base?.purchasePrice ?? 0,
    });
  };

  // each unit has its own purchase price, so changing the unit resets the price
  const handleUnitChange = (id, unitId) => {
    if (!unitId) return;
    const line = form.products.find((l) => l.id === id);
    updateLine(id, {
      unit: unitId,
      unitPurchasePrice: levelOf(line?.product, unitId)?.purchasePrice ?? 0,
    });
  };

  const stepQuantity = (id, current, delta) =>
    updateLine(id, { quantity: Math.max(0, round3((Number(current) || 0) + delta)) });

  const addProduct = () =>
    setForm((prev) => ({ ...prev, products: [...prev.products, emptyLine()] }));

  // the last remaining line is never removed (its button is disabled too)
  const removeProduct = (id) =>
    setForm((prev) =>
      prev.products.length <= 1 ? prev : { ...prev, products: prev.products.filter((l) => l.id !== id) }
    );

  // =========================
  // PAYMENTS (immutable updates)
  // =========================

  const handlePaymentType = (value) => {
    if (!value) return;
    setForm((prev) => ({
      ...prev,
      paymentType: value,
      // "advanced" opens with one payment ready to fill, like the old form did
      payments: value === "advanced" && prev.payments.length === 0 ? [emptyPayment()] : prev.payments,
    }));
  };

  const addPayment = () =>
    setForm((prev) => ({ ...prev, payments: [...prev.payments, emptyPayment()] }));

  const updatePayment = (id, patch) =>
    setForm((prev) => ({
      ...prev,
      payments: prev.payments.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));

  const removePayment = (id) =>
    setForm((prev) => ({ ...prev, payments: prev.payments.filter((p) => p.id !== id) }));

  // =========================
  // CALCULATIONS
  // =========================

  const lines = form.products.map((l) => {
    const level = levelOf(l.product, l.unit);
    const qty = Number(l.quantity) || 0;
    const price = Number(l.unitPurchasePrice) || 0;
    return {
      level,
      qty,
      price,
      base: level ? toBaseQty(qty, level.factor) : 0,
      total: round2(qty * price),
    };
  });

  const lineError = (l, c) => {
    if (!l.product) return null;
    if (c.base && !Number.isInteger(c.base)) return tr("Whole-Base", "Must convert to whole base units");
    return null;
  };

  const total = round2(lines.reduce((s, c) => s + c.total, 0));
  const usesPayments = form.paymentType === "advanced";
  const paid = usesPayments
    ? round2(form.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0))
    : 0;
  const remaining = round2(total - paid);

  // =========================
  // SUBMIT
  // =========================

  const validate = () => {
    if (!form.vendor) return "Select a supplier.";
    if (!toDate(form.orderDate)) return "Select the order date.";
    if (form.deliveryDate && !toDate(form.deliveryDate)) return "The delivery date is not valid.";
    if (form.products.length === 0) return "Add at least one product.";
    for (let i = 0; i < form.products.length; i++) {
      const l = form.products[i];
      const c = lines[i];
      if (!l.product) return `Line ${i + 1}: select a product.`;
      if (!c.level) return `Line ${i + 1}: select a unit.`;
      if (!(c.qty > 0)) return `Line ${i + 1}: quantity must be greater than zero.`;
      if (c.price < 0) return `Line ${i + 1}: price cannot be negative.`;
      if (!Number.isInteger(c.base)) {
        return `Line ${i + 1}: this quantity doesn't convert to a whole number of base units.`;
      }
    }
    if (usesPayments) {
      for (const p of form.payments) {
        if (Number(p.amount) > 0 && !p.method) return "Select a payment method.";
        if (Number(p.amount) > 0 && p.method === "Bankak" && !String(p.transactionNumber).trim()) {
          return "Enter the Bankak transaction number.";
        }
      }
      if (remaining < 0) return "Payments exceed the invoice total.";
    }
    return null;
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const problem = validate();
    if (problem) {
      showNotification({ title: "Check the order", message: problem, color: "red" });
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        vendor: form.vendor,
        products: form.products.map((item, i) => ({
          product: item.product,
          unit: item.unit, // a unit id
          quantity: Number(item.quantity),
          unitPurchasePrice: Number(item.unitPurchasePrice),
          unitTotalPrice: lines[i].total,
        })),
        paymentType: form.paymentType,
        payments: usesPayments
          ? form.payments
              .filter((p) => Number(p.amount) > 0)
              .map((p) => ({
                amount: Number(p.amount),
                paymentMethod: p.method,
                transactionNumber: p.method === "Bankak" ? String(p.transactionNumber).trim() : undefined,
                notes: p.notes,
              }))
          : [],
        orderDate: toIso(form.orderDate),
        deliveryDate: toIso(form.deliveryDate),
        notes: form.notes,
      };

      const token = localStorage.getItem("authToken");
      const response = await axios.post(`${BASE_URL}/purchase-invoices/create`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showNotification({ title: "Success", message: "Order placed successfully", color: "green" });

      // mirror the stock increase locally so the dropdown isn't stale
      const added = new Map();
      form.products.forEach((l, i) => {
        added.set(String(l.product), (added.get(String(l.product)) ?? 0) + lines[i].base);
      });
      setInventoryData?.((prev) =>
        Array.isArray(prev)
          ? prev.map((inv) => {
              const a = added.get(String(inv.product?._id));
              return a ? { ...inv, quantityBase: (inv.quantityBase ?? 0) + a } : inv;
            })
          : prev
      );

      if (response.data?.invoice) {
        setOrdersData?.((prev) => (Array.isArray(prev) ? [...prev, response.data.invoice] : prev));
      }

      setForm(initialForm());
      setOpened(false);
    } catch (error) {
      const d = error.response?.data;
      showNotification({
        title: "Error creating invoice",
        message: String(d?.message || d?.error || error.message || "Something went wrong."),
        color: "red",
      });
      // the modal stays open so nothing typed is lost
    } finally {
      setSubmitting(false);
    }
  };

  // =========================
  // UI
  // =========================

  const lastPaymentId = form.payments[form.payments.length - 1]?.id;
  const onlyOneLine = form.products.length <= 1;

  return (
    <Modal.Root
      opened={opened}
      onClose={close}
      size={1040}
      padding={0}
      radius={12}
      // centered
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
    >
      <Modal.Overlay backgroundOpacity={0.55} />
      <Modal.Content className="csi-content of-content">
        {/* ============ header ============ */}
        <div className="of-head">
          <span className="of-badge">
            <IconTruck size={22} stroke={1.8} aria-hidden="true" />
          </span>
          <div className="of-titles">
            <Modal.Title className="of-title">{t("Create-New-Order")}</Modal.Title>
            <p className="of-sub">{tr("ORDER-SUBTITLE", "Order stock from a supplier")}</p>
          </div>
          <button type="button" className="of-close" aria-label="Close" onClick={close} disabled={submitting}>
            <IconX size={20} stroke={2} aria-hidden="true" />
          </button>
        </div>

        <Modal.Body>
          <div className="csi-grid">
            {/* ============ main column: supplier, products, dates, notes ============ */}
            <div className="csi-left">
              <div>
                <span className="csi-lb">
                  {t("SELECT-SUPPLIER")}
                  <Req />
                </span>
                <Select
                  aria-label={t("SELECT-SUPPLIER")}
                  aria-required="true"
                  placeholder={t("SELECT-SUPPLIER")}
                  data={supplierOptions}
                  value={form.vendor || null}
                  onChange={(v) => setForm((prev) => ({ ...prev, vendor: v ?? "" }))}
                  searchable
                  allowDeselect={false}
                  nothingFoundMessage={tr("No-Suppliers", "No suppliers found")}
                />
              </div>

              <div>
                <div className="csi-th" aria-hidden="true">
                  <span>
                    {tr("Product", "Product")}
                    <Req />
                  </span>
                  <span>
                    {t("Quantity")}
                    <Req />
                  </span>
                  <span>
                    {t("Unit")}
                    <Req />
                  </span>
                  <span>
                    {t("Unit-Price")}
                    <Req />
                  </span>
                  <span className="csi-end">{tr("Total", "Total")}</span>
                  <span />
                </div>

                {form.products.map((item, index) => {
                  const c = lines[index];
                  const inv = inventoryByProduct.get(String(item.product));
                  const levels = inv?.product?.unitLevels ?? [];
                  const baseName = levels.find((l) => l.factor === 1)?.unit?.name ?? "";
                  const error = lineError(item, c);

                  return (
                    <div className="csi-it" key={item.id}>
                      {/* product + current stock caption */}
                      <div className="csi-c-prod">
                        <Select
                          aria-label={`${tr("Product", "Product")} ${index + 1}`}
                          aria-required="true"
                          placeholder={tr("Select-Product", "Select product")}
                          data={productOptions}
                          value={item.product || null}
                          onChange={(v) => handleProductChange(item.id, v)}
                          searchable
                          allowDeselect={false}
                          nothingFoundMessage={tr("No-Products", "No products found")}
                          maxDropdownHeight={280}
                        />
                        {item.product && (
                          <>
                            <div className={error ? "csi-sm csi-bad" : "csi-sm"}>
                              {error ??
                                tr("In-Stock", "{{stock}} in stock", {
                                  stock: stockParts(levels, inv?.quantityBase).join(" · ") || 0,
                                })}
                            </div>
                            {!error && c.level?.factor > 1 && c.qty > 0 && (
                              <div className="csi-sm">
                                {tr("Adds-To-Stock", "Adds {{n}} {{unit}} to stock", {
                                  n: money(c.base),
                                  unit: baseName,
                                })}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* quantity stepper */}
                      <div className="csi-c-qty">
                        <div className="csi-q" data-invalid={error ? "true" : "false"}>
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            disabled={(Number(item.quantity) || 0) <= 1}
                            onClick={() => stepQuantity(item.id, item.quantity, -1)}
                          >
                            <IconMinus size={16} stroke={2} aria-hidden="true" />
                          </button>
                          <NumberInput
                            className="csi-qroot"
                            variant="unstyled"
                            hideControls
                            aria-label={t("Quantity")}
                            aria-required="true"
                            value={item.quantity}
                            onChange={(v) => updateLine(item.id, { quantity: v })}
                            min={0}
                            decimalScale={3}
                            allowNegative={false}
                          />
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() => stepQuantity(item.id, item.quantity, 1)}
                          >
                            <IconPlus size={16} stroke={2} aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      {/* unit: only the selected product's own units */}
                      <div className="csi-c-unit">
                        <Select
                          aria-label={`${t("Unit")} ${index + 1}`}
                          aria-required="true"
                          placeholder={t("Unit")}
                          data={unitOptionsFor(item.product)}
                          value={item.unit || null}
                          onChange={(v) => handleUnitChange(item.id, v)}
                          disabled={!item.product}
                          allowDeselect={false}
                        />
                      </div>

                      {/* purchase price (defaults from the unit, editable) */}
                      <div className="csi-c-price">
                        <NumberInput
                          className="csi-num"
                          hideControls
                          aria-label={t("Unit-Price")}
                          aria-required="true"
                          value={item.unitPurchasePrice}
                          onChange={(v) => updateLine(item.id, { unitPurchasePrice: v })}
                          min={0}
                          allowNegative={false}
                        />
                      </div>

                      <div className="csi-c-total">{money(c.total)}</div>

                      <div className="csi-c-del">
                        <button
                          type="button"
                          className="csi-ib"
                          aria-label={t("Remove")}
                          disabled={onlyOneLine}
                          onClick={() => removeProduct(item.id)}
                        >
                          <IconTrash size={18} stroke={2} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                <button type="button" className="csi-btn csi-add" onClick={addProduct}>
                  <IconPlus size={16} stroke={2} aria-hidden="true" />
                  {t("Add-Another-Product")}
                </button>
              </div>

              <div className="of-dates">
                <div>
                  <span className="csi-lb">
                    {t("Order-Date")}
                    <Req />
                  </span>
                  <DateInput
                    aria-label={t("Order-Date")}
                    aria-required="true"
                    placeholder={tr("Select-Date", "Select date")}
                    valueFormat="DD-MM-YYYY"
                    value={toDate(form.orderDate)}
                    onChange={(date) => setForm((prev) => ({ ...prev, orderDate: date }))}
                    rightSection={<IconCalendar size={16} stroke={2} aria-hidden="true" />}
                    rightSectionPointerEvents="none"
                  />
                </div>
                <div>
                  <span className="csi-lb">
                    {t("DELIVERY-DATE")} · {tr("optional", "optional")}
                  </span>
                  <DateInput
                    aria-label={t("DELIVERY-DATE")}
                    placeholder={tr("Select-Date", "Select date")}
                    valueFormat="DD-MM-YYYY"
                    value={toDate(form.deliveryDate)}
                    onChange={(date) => setForm((prev) => ({ ...prev, deliveryDate: date }))}
                    rightSection={<IconCalendar size={16} stroke={2} aria-hidden="true" />}
                    rightSectionPointerEvents="none"
                    clearable
                  />
                </div>
              </div>

              <div>
                <span className="csi-lb">
                  {tr("Notes", "Notes")} · {tr("optional", "optional")}
                </span>
                <Textarea
                  aria-label={tr("Notes", "Notes")}
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.currentTarget.value }))}
                />
              </div>
            </div>

            {/* ============ right panel: summary, payments, actions ============ */}
            <div className="csi-right">
              <div className="csi-right-scroll">
                <h2 className="csi-h2">{tr("Summary", "Summary")}</h2>

                <div>
                  <span className="csi-lb">{t("Payment-Type")}</span>
                  <Select
                    aria-label={t("Payment-Type")}
                    data={[
                      { value: "advanced", label: tr("Advanced", "Advanced") },
                      { value: "later", label: tr("Later", "Later") },
                    ]}
                    value={form.paymentType}
                    onChange={handlePaymentType}
                    allowDeselect={false}
                  />
                </div>

                <div className="csi-row csi-total">
                  <b>{tr("Total", "Total")}</b>
                  <span className="csi-big">
                    {money(total)} {currency}
                  </span>
                </div>

                {usesPayments && (
                  <>
                    <div className="csi-row" style={{ marginTop: 4 }}>
                      <h2 className="csi-h2">{tr("Payments", "Payments")}</h2>
                      {form.payments.length > 0 && (
                        <button type="button" className="csi-btn csi-txt" onClick={addPayment}>
                          <IconPlus size={16} stroke={2} aria-hidden="true" />
                          {tr("Add-Payment", "Add payment")}
                        </button>
                      )}
                    </div>

                    {form.payments.length === 0 ? (
                      <div className="csi-pay csi-empty">
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{tr("No-Payments", "No payments yet")}</div>
                        <div className="csi-sm" style={{ margin: "0 0 6px" }}>
                          {tr("Balance-Due", "The full amount stays as balance due.")}
                        </div>
                        <button type="button" className="csi-btn" onClick={addPayment}>
                          <IconPlus size={16} stroke={2} aria-hidden="true" />
                          {tr("Add-Payment", "Add payment")}
                        </button>
                      </div>
                    ) : (
                      form.payments.map((p) => (
                        <div className="csi-pay" key={p.id}>
                          <Seg
                            label={tr("Method", "Payment method")}
                            options={METHODS.map((m) => ({ value: m, label: m }))}
                            value={p.method}
                            onChange={(v) => updatePayment(p.id, { method: v })}
                          />

                          <div className="csi-pay-row">
                            <NumberInput
                              className="csi-num csi-grow"
                              hideControls
                              aria-label={tr("Amount", "Amount")}
                              value={p.amount}
                              onChange={(v) => updatePayment(p.id, { amount: v })}
                              min={0}
                              allowNegative={false}
                            />
                            <button
                              type="button"
                              className="csi-ib"
                              aria-label={tr("Remove-Payment", "Remove payment")}
                              onClick={() => removePayment(p.id)}
                            >
                              <IconTrash size={18} stroke={2} aria-hidden="true" />
                            </button>
                          </div>

                          {p.method === "Bankak" && (
                            <TextInput
                              aria-label={tr("Transaction", "Transaction number")}
                              placeholder={tr("Transaction", "Transaction number")}
                              value={p.transactionNumber}
                              onChange={(e) => updatePayment(p.id, { transactionNumber: e.currentTarget.value })}
                            />
                          )}

                          <TextInput
                            aria-label={tr("Notes", "Notes")}
                            placeholder={`${tr("Note", "Note")} · ${tr("optional", "optional")}`}
                            value={p.notes}
                            onChange={(e) => updatePayment(p.id, { notes: e.currentTarget.value })}
                          />

                          {p.id === lastPaymentId && remaining > 0 && (
                            <button
                              type="button"
                              className="csi-chip"
                              onClick={() =>
                                updatePayment(p.id, { amount: round2((Number(p.amount) || 0) + remaining) })
                              }
                            >
                              {tr("Fill-Remaining", "Fill remaining · {{amount}} {{currency}}", {
                                amount: money(remaining),
                                currency,
                              })}
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </>
                )}

                <div className="csi-bal">
                  <div className="csi-row">
                    <span>{tr("Paid", "Paid")}</span>
                    <span style={{ color: "var(--csi-ink)", fontWeight: 500 }}>
                      {money(paid)} {currency}
                    </span>
                  </div>
                  <div className="csi-row">
                    <span style={{ fontWeight: 600, color: "var(--csi-ink)" }}>
                      {remaining < 0 ? tr("Overpaid", "Overpaid") : tr("Remaining", "Remaining")}
                    </span>
                    <span
                      className={
                        remaining < 0 ? "csi-due csi-over" : remaining === 0 ? "csi-due csi-ok" : "csi-due"
                      }
                    >
                      {money(Math.abs(remaining))} {currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* primary first, as in the design (it sits on the start side) */}
              <div className="csi-footer">
                <button
                  type="button"
                  className="csi-btn csi-pri"
                  style={{ height: 44, flex: 1 }}
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting && <Loader size={16} color="white" />}
                  {t("CREATE-ORDER")}
                </button>
                <button type="button" className="csi-btn" style={{ height: 44 }} onClick={close} disabled={submitting}>
                  {t("CANCEL")}
                </button>
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
};

export default OrderForm;