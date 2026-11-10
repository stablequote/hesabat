import { useEffect, useRef, useState } from "react";
import { Modal, Loader } from "@mantine/core";
import { IconBuildingStore, IconHash, IconPhone, IconMapPin, IconX } from "@tabler/icons-react";
import "../assets/css/AddVendorModal.css";

const EMPTY_FORM = { name: "", vendorID: "", phone: "", location: "" };

// label + leading icon + native input. Native markup (not Mantine's TextInput) so the icon
// spacing is exact and never depends on the page direction.
function Field({ id, label, optional, icon: Icon, error, ...inputProps }) {
  return (
    <div>
      <label className="vm-label" htmlFor={id}>
        {label}
        {optional && <span className="vm-opt"> · Optional</span>}
      </label>
      <div className="vm-control" data-invalid={error ? "true" : "false"}>
        <Icon className="vm-ico" size={18} stroke={1.6} aria-hidden="true" />
        <input
          id={id}
          className="vm-input"
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          autoComplete="off"
          {...inputProps}
        />
      </div>
      {error && (
        <div id={`${id}-error`} className="vm-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

function AddVendorModal({
  opened,
  setOpened,
  vendorForm,
  handleChange,
  setVendorForm,
  submitVendorForm,
  dir = "ltr", // the design is left-to-right; pass dir="rtl" to mirror it
}) {
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // starts a fresh form every time the modal closes (cancelled, closed, or after a successful create)
  const wasOpen = useRef(opened);
  useEffect(() => {
    if (wasOpen.current && !opened) {
      setVendorForm?.(EMPTY_FORM);
      setErrors({});
    }
    wasOpen.current = opened;
  }, [opened]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => {
    if (!submitting) setOpened(false);
  };

  const onField = (field) => (e) => {
    handleChange(field, e.currentTarget.value);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!vendorForm.name?.trim()) next.name = "Enter the vendor's name.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Enter in any field submits the form
    if (submitting || !validate()) return;
    try {
      setSubmitting(true);
      await submitVendorForm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal.Root
      opened={opened}
      onClose={close}
      size={480}
      padding={0}
      radius={14}
      // centered
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
    >
      <Modal.Overlay backgroundOpacity={0.55} />
      <Modal.Content className="vm-content" dir={dir}>
        <div className="vm-head">
          <span className="vm-badge">
            <IconBuildingStore size={20} stroke={1.75} aria-hidden="true" />
          </span>
          <div className="vm-titles">
            <Modal.Title className="vm-title">New vendor</Modal.Title>
            <p className="vm-sub">Add a supplier you buy stock from.</p>
          </div>
          <button type="button" className="vm-close" aria-label="Close" onClick={close} disabled={submitting}>
            <IconX size={18} stroke={1.75} aria-hidden="true" />
          </button>
        </div>

        <Modal.Body className="vm-body">
          <form onSubmit={handleSubmit} noValidate>
            <div className="vm-fields">
              <Field
                id="vm-name"
                label="Vendor name"
                icon={IconBuildingStore}
                placeholder="Business or supplier name"
                value={vendorForm.name}
                onChange={onField("name")}
                error={errors.name}
                data-autofocus
              />

              <div className="vm-row">
                <Field
                  id="vm-vendor-id"
                  label="Vendor ID"
                  optional
                  icon={IconHash}
                  placeholder="ID or code"
                  value={vendorForm.vendorID}
                  onChange={onField("vendorID")}
                />
                <Field
                  id="vm-phone"
                  label="Phone"
                  optional
                  icon={IconPhone}
                  type="tel"
                  inputMode="tel"
                  placeholder="Phone number"
                  value={vendorForm.phone}
                  onChange={onField("phone")}
                />
              </div>

              <Field
                id="vm-location"
                label="Location"
                optional
                icon={IconMapPin}
                placeholder="City or area"
                value={vendorForm.location}
                onChange={onField("location")}
              />
            </div>

            <div className="vm-foot">
              <button type="button" className="vm-btn" onClick={close} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="vm-btn vm-pri" disabled={submitting}>
                {submitting && <Loader size={16} color="white" />}
                Create vendor
              </button>
            </div>
          </form>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}

export default AddVendorModal;