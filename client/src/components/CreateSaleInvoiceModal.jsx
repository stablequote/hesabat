import { useState, useMemo } from "react";
import { Modal, Select, NumberInput, TextInput, Textarea, Loader } from "@mantine/core";
import { IconPlus, IconMinus, IconTrash, IconUserPlus } from "@tabler/icons-react";
import axios from "axios";
import { showNotification } from "@mantine/notifications";
import { stockParts } from "../utils/units";
import "../assets/css/CreateSaleInvoiceModal.css";

// ---------- helpers (outside the component) ----------
const idOf = (u) => String(u?._id ?? u ?? "");
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const round3 = (n) => Math.round(Number(n) * 1000) / 1000;
// avoids float noise, e.g. 0.7 * 10 = 7.000000000000001
const toBaseQty = (qty, factor) => Math.round(qty * factor * 1e6) / 1e6;
const money = (n) => Number(n || 0).toLocaleString();

// stable keys for rows, so removing a row never shifts another row's state
let seq = 0;
const nextId = () => ++seq;

const emptyLine = () => ({ id: nextId(), product: "", unit: "", quantity: 1, salePrice: 0 });
const emptyPayment = () => ({ id: nextId(), method: "Cash", amount: 0, transactionNumber: "" });
const initialForm = () => ({
  client: "",
  products: [emptyLine()],
  payments: [], // collapsed until the user adds one
  discountType: "amount", // "amount" | "percent"
  discount: 0,
  notes: "",
});

const METHOD_OPTIONS = [
  { value: "Cash", label: "Cash" },
  { value: "Bankak", label: "Bankak" },
];
const DISCOUNT_TYPES = (currency) => [
  { value: "amount", label: currency },
  { value: "percent", label: "%" },
];

// two-option toggle used for payment method and discount type
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

const CreateSaleInvoiceModal = ({
  opened,
  setOpened,
  clients,
  inventoryData,
  setInventoryData,
  token,
  BASE_URL,
  onSuccess,
  setAddClientModalOpened,
  currency = "SDG",
}) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialForm());

  const close = () => {
    if (!loading) setOpened(false);
  };

  // =========================
  // LOOKUPS
  // =========================

  const clientOptions = useMemo(
    () =>
      (clients ?? [])
        .map((c) => (typeof c === "string" ? { value: c, label: c } : c))
        .filter((c) => c?.value != null)
        .map((c) => ({ value: String(c.value), label: String(c.label ?? c.value) })),
    [clients]
  );

  const inventoryByProduct = useMemo(() => {
    const map = new Map();
    (inventoryData ?? []).forEach((i) => {
      if (i?.product?._id) map.set(String(i.product._id), i);
    });
    return map;
  }, [inventoryData]);

  const productOptions = useMemo(
    () =>
      (inventoryData ?? [])
        .filter((i) => i?.product?._id) // skips unpopulated or orphaned rows
        .map((i) => ({
          value: String(i.product._id),
          label: i.product.name ?? "Unnamed product",
          disabled: !(i.quantityBase > 0),
        })),
    [inventoryData]
  );

  const levelOf = (productId, unitId) =>
    inventoryByProduct
      .get(String(productId))
      ?.product?.unitLevels?.find((l) => idOf(l.unit) === String(unitId));

  const unitOptionsFor = (productId) =>
    (inventoryByProduct.get(String(productId))?.product?.unitLevels ?? []).map((l) => ({
      value: idOf(l.unit),
      label: l.unit?.name ?? "Unit",
    }));

  // =========================
  // PRODUCT LINES (immutable updates)
  // =========================

  const updateLine = (id, patch) =>
    setForm((prev) => ({
      ...prev,
      products: prev.products.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));

  // choosing a product defaults to its base unit (factor 1) and that unit's price
  const handleProductChange = (id, productId) => {
    if (!productId) {
      updateLine(id, { product: "", unit: "", salePrice: 0 });
      return;
    }
    const levels = inventoryByProduct.get(String(productId))?.product?.unitLevels ?? [];
    const base = levels.find((l) => l.factor === 1) ?? levels[0];
    updateLine(id, {
      product: productId,
      unit: base ? idOf(base.unit) : "",
      salePrice: base?.salePrice ?? 0,
    });
  };

  // each unit has its own price, so changing the unit resets the price to that unit's price
  const handleUnitChange = (id, unitId) => {
    if (!unitId) return;
    const line = form.products.find((l) => l.id === id);
    updateLine(id, {
      unit: unitId,
      salePrice: levelOf(line?.product, unitId)?.salePrice ?? 0,
    });
  };

  const stepQuantity = (id, current, delta) =>
    updateLine(id, { quantity: Math.max(0, round3((Number(current) || 0) + delta)) });

  const addProduct = () =>
    setForm((prev) => ({ ...prev, products: [...prev.products, emptyLine()] }));

  const removeProduct = (id) =>
    setForm((prev) => ({ ...prev, products: prev.products.filter((l) => l.id !== id) }));

  // =========================
  // PAYMENTS (each card is one payment with one transaction)
  // =========================

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
    const price = Number(l.salePrice) || 0;
    return {
      level,
      qty,
      price,
      base: level ? toBaseQty(qty, level.factor) : 0, // quantity in base units
      total: round2(qty * price),
    };
  });

  // total base units requested per product, across all lines
  const requestedBase = new Map();
  form.products.forEach((l, i) => {
    if (l.product) {
      requestedBase.set(l.product, (requestedBase.get(l.product) ?? 0) + lines[i].base);
    }
  });

  const lineError = (l, c) => {
    if (!l.product) return null;
    if (c.base && !Number.isInteger(c.base)) return "Must convert to whole base units";
    const available = inventoryByProduct.get(String(l.product))?.quantityBase ?? 0;
    if ((requestedBase.get(l.product) ?? 0) > available) {
      const shared = form.products.filter((x) => x.product === l.product).length > 1;
      return shared ? "Exceeds stock across lines" : "Exceeds available stock";
    }
    return null;
  };

  const subtotal = round2(lines.reduce((s, c) => s + c.total, 0));

  // the server always receives the discount as an amount; a % is converted here
  const discountInput = Number(form.discount) || 0;
  const discountRaw =
    form.discountType === "percent" ? round2((subtotal * discountInput) / 100) : discountInput;
  const discountTooBig =
    form.discountType === "percent" ? discountInput > 100 : discountInput > subtotal;
  const discount = Math.min(Math.max(discountRaw, 0), subtotal);

  const total = round2(subtotal - discount);
  const paid = round2(form.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0));
  const remaining = round2(total - paid);

  // =========================
  // SUBMIT
  // =========================

  const validate = () => {
    if (!form.client) return "Select a client.";
    if (form.products.length === 0) return "Add at least one product.";
    for (let i = 0; i < form.products.length; i++) {
      const l = form.products[i];
      const c = lines[i];
      if (!l.product) return `Line ${i + 1}: select a product.`;
      if (!c.level) return `Line ${i + 1}: select a unit.`;
      if (!(c.qty > 0)) return `Line ${i + 1}: quantity must be greater than zero.`;
      if (c.price < 0) return `Line ${i + 1}: price cannot be negative.`;
      const err = lineError(l, c);
      if (err) return `Line ${i + 1}: ${err}.`;
    }
    if (discountInput < 0 || discountTooBig) return "The discount can't exceed the subtotal.";
    for (const p of form.payments) {
      if (Number(p.amount) > 0 && p.method === "Bankak" && !String(p.transactionNumber).trim()) {
        return "Enter the Bankak transaction number.";
      }
    }
    if (remaining < 0) return "Payments exceed the invoice total.";
    return null;
  };

  const handleSubmit = async () => {
    const problem = validate();
    if (problem) {
      showNotification({ title: "Check the invoice", message: problem, color: "red" });
      return;
    }

    try {
      setLoading(true);

      const formattedPayments = form.payments
        .filter((p) => Number(p.amount) > 0)
        .map((p) => {
          const amount = round2(p.amount);
          return {
            totalAmount: amount,
            transactions: [
              {
                amount,
                method: p.method,
                transactionNumber: p.method === "Bankak" ? String(p.transactionNumber).trim() : "",
              },
            ],
            notes: "",
          };
        });

      const payload = {
        client: form.client,
        products: form.products.map((p) => ({
          product: p.product,
          unit: p.unit, // a unit id
          quantity: Number(p.quantity),
          salePrice: Number(p.salePrice),
        })),
        payments: formattedPayments,
        notes: form.notes,
        discount, // always an amount, never a percentage
      };

      const res = await axios.post(`${BASE_URL}/sale-invoices/create`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showNotification({ title: "Success", message: "Invoice created", color: "green" });

      // mirror the server's deduction locally so the dropdown isn't stale
      const used = new Map(requestedBase);
      setInventoryData?.((prev) =>
        Array.isArray(prev)
          ? prev.map((inv) => {
              const u = used.get(String(inv.product?._id));
              return u ? { ...inv, quantityBase: inv.quantityBase - u } : inv;
            })
          : prev
      );

      onSuccess?.(res.data.invoice);
      setForm(initialForm());
      setOpened(false);
    } catch (err) {
      const d = err.response?.data;
      showNotification({
        title: "Error",
        message: d?.message || d?.error || err.message,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // UI
  // =========================

  const lastPaymentId = form.payments[form.payments.length - 1]?.id;

  return (
    <Modal
      opened={opened}
      onClose={close}
      title="Create sale invoice"
      size={1100}
      padding={0}
      radius={12}
      // centered
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
      closeButtonProps={{ "aria-label": "Close", disabled: loading }}
      classNames={{ content: "csi-content" }}
      
    >
      <div className="csi-grid">
        {/* ============ LEFT: client, products, notes ============ */}
        <div className="csi-left">
          <div>
            <span className="csi-lb">Client</span>
            <div style={{ display: "flex", gap: 8 }}>
              <Select
                className="csi-grow"
                aria-label="Client"
                placeholder="Select client"
                data={clientOptions}
                value={form.client || null}
                onChange={(v) => setForm((prev) => ({ ...prev, client: v ?? "" }))}
                searchable
                allowDeselect={false}
                nothingFoundMessage="No clients found"
              />
              <button
                type="button"
                className="csi-btn"
                style={{ flex: "none" }}
                onClick={() => setAddClientModalOpened?.(true)}
              >
                <IconUserPlus size={16} aria-hidden="true" />
                New client
              </button>
            </div>
          </div>

          <div>
            <div className="csi-th" aria-hidden="true">
              <span>Product</span>
              <span>Unit</span>
              <span>Qty</span>
              <span>Price</span>
              <span className="csi-end">Total</span>
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
                  {/* product + stock caption */}
                  <div className="csi-c-prod">
                    <Select
                      aria-label={`Product, line ${index + 1}`}
                      placeholder="Select product"
                      data={productOptions}
                      value={item.product || null}
                      onChange={(v) => handleProductChange(item.id, v)}
                      searchable
                      allowDeselect={false}
                      nothingFoundMessage="No products found"
                      maxDropdownHeight={280}
                    />
                    {item.product && (
                      <>
                        <div className={error ? "csi-sm csi-bad" : "csi-sm"}>
                          {error ??
                            `${stockParts(levels, inv?.quantityBase).join(" · ") || 0} in stock`}
                        </div>
                        {!error && c.level?.factor > 1 && c.qty > 0 && (
                          <div className="csi-sm">
                            = {money(c.base)} {baseName}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* unit: only the selected product's own units */}
                  <div className="csi-c-unit">
                    <Select
                      aria-label={`Unit, line ${index + 1}`}
                      placeholder="Unit"
                      data={unitOptionsFor(item.product)}
                      value={item.unit || null}
                      onChange={(v) => handleUnitChange(item.id, v)}
                      disabled={!item.product}
                      allowDeselect={false}
                    />
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
                        <IconMinus size={16} aria-hidden="true" />
                      </button>
                      <NumberInput
                        className="csi-qroot"
                        variant="unstyled"
                        hideControls
                        aria-label="Quantity"
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
                        <IconPlus size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {/* price (defaults from the unit, editable) */}
                  <div className="csi-c-price">
                    <NumberInput
                      className="csi-num"
                      hideControls
                      aria-label="Sale price"
                      placeholder="Price"
                      value={item.salePrice}
                      onChange={(v) => updateLine(item.id, { salePrice: v })}
                      min={0}
                      allowNegative={false}
                    />
                  </div>

                  <div className="csi-c-total">
                    {money(c.total)} {currency}
                  </div>

                  <div className="csi-c-del">
                    <button
                      type="button"
                      className="csi-ib"
                      aria-label="Remove product"
                      onClick={() => removeProduct(item.id)}
                    >
                      <IconTrash size={18} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}

            <button type="button" className="csi-btn csi-add" onClick={addProduct}>
              <IconPlus size={16} aria-hidden="true" />
              Add product
            </button>
          </div>

          <Textarea
            label="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          />
        </div>

        {/* ============ RIGHT: summary, payments, actions ============ */}
        <div className="csi-right">
          <div className="csi-right-scroll">
            <h2 className="csi-h2">Summary</h2>

            <div className="csi-row">
              <span>Subtotal</span>
              <span>
                {money(subtotal)} {currency}
              </span>
            </div>

            <div>
              <span className="csi-lb">Discount</span>
              <div className="csi-disc">
                <NumberInput
                  className="csi-num csi-grow"
                  hideControls
                  aria-label="Discount"
                  value={form.discount}
                  onChange={(v) => setForm((prev) => ({ ...prev, discount: v }))}
                  min={0}
                  max={form.discountType === "percent" ? 100 : undefined}
                  allowNegative={false}
                />
                <Seg
                  label="Discount type"
                  options={DISCOUNT_TYPES(currency)}
                  value={form.discountType}
                  onChange={(v) => setForm((prev) => ({ ...prev, discountType: v, discount: 0 }))}
                />
              </div>
              {form.discountType === "percent" && discountInput > 0 && (
                <div className={discountTooBig ? "csi-sm csi-bad" : "csi-sm"}>
                  {discountTooBig
                    ? "A discount can't exceed 100%"
                    : `− ${money(discount)} ${currency}`}
                </div>
              )}
              {form.discountType === "amount" && discountTooBig && (
                <div className="csi-sm csi-bad">The discount can't exceed the subtotal</div>
              )}
            </div>

            <div className="csi-row csi-total">
              <b>Total</b>
              <span className="csi-big">
                {money(total)} {currency}
              </span>
            </div>

            <div className="csi-row" style={{ marginTop: 4 }}>
              <h2 className="csi-h2">Payments</h2>
              {form.payments.length > 0 && (
                <button type="button" className="csi-btn csi-txt" onClick={addPayment}>
                  <IconPlus size={16} aria-hidden="true" />
                  Add payment
                </button>
              )}
            </div>

            {form.payments.length === 0 ? (
              <div className="csi-pay csi-empty">
                <div style={{ fontSize: 14, fontWeight: 500 }}>No payments yet</div>
                <div className="csi-sm" style={{ margin: "0 0 6px" }}>
                  The full amount stays as balance due.
                </div>
                <button type="button" className="csi-btn" onClick={addPayment}>
                  <IconPlus size={16} aria-hidden="true" />
                  Add payment
                </button>
              </div>
            ) : (
              form.payments.map((p) => (
                <div className="csi-pay" key={p.id}>
                  <Seg
                    label="Payment method"
                    options={METHOD_OPTIONS}
                    value={p.method}
                    onChange={(v) => updatePayment(p.id, { method: v })}
                  />

                  <div className="csi-pay-row">
                    <NumberInput
                      className="csi-num csi-grow"
                      hideControls
                      aria-label="Payment amount"
                      value={p.amount}
                      onChange={(v) => updatePayment(p.id, { amount: v })}
                      min={0}
                      allowNegative={false}
                    />
                    <button
                      type="button"
                      className="csi-ib"
                      aria-label="Remove payment"
                      onClick={() => removePayment(p.id)}
                    >
                      <IconTrash size={18} aria-hidden="true" />
                    </button>
                  </div>

                  {p.method === "Bankak" && (
                    <TextInput
                      aria-label="Bankak transaction number"
                      placeholder="Transaction number"
                      value={p.transactionNumber}
                      onChange={(e) =>
                        updatePayment(p.id, { transactionNumber: e.currentTarget.value })
                      }
                    />
                  )}

                  {p.id === lastPaymentId && remaining > 0 && (
                    <button
                      type="button"
                      className="csi-chip"
                      onClick={() =>
                        updatePayment(p.id, { amount: round2((Number(p.amount) || 0) + remaining) })
                      }
                    >
                      Fill remaining · {money(remaining)} {currency}
                    </button>
                  )}
                </div>
              ))
            )}

            <div className="csi-bal">
              <div className="csi-row">
                <span>Paid</span>
                <span style={{ color: "var(--csi-ink)", fontWeight: 500 }}>
                  {money(paid)} {currency}
                </span>
              </div>
              <div className="csi-row">
                <span style={{ fontWeight: 600, color: "var(--csi-ink)" }}>
                  {remaining < 0 ? "Overpaid" : "Remaining"}
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

          <div className="csi-footer">
            <button type="button" className="csi-btn" style={{ height: 44 }} onClick={close} disabled={loading}>
              Cancel
            </button>
            <button
              type="button"
              className="csi-btn csi-pri"
              style={{ height: 44, flex: 1 }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading && <Loader size={16} color="white" />}
              Create invoice
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CreateSaleInvoiceModal;