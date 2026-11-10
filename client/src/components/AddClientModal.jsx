import { useEffect, useRef, useState } from "react";
import { Modal, TextInput, Loader } from "@mantine/core";
import { IconUser, IconPhone, IconMail, IconMapPin, IconUserPlus } from "@tabler/icons-react";
import "../assets/css/AddClientModal.css";

const EMPTY_FORM = { name: "", phone: "", location: "", email: "" };
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

// shared by the four fields: a leading icon in a 44px section
const icon = (Icon) => <Icon size={19} stroke={1.75} aria-hidden="true" />;
const SECTION_WIDTH = 44;

function AddClientModal({ opened, setOpened, clientForm, handleChange, setClientForm, submitClientForm }) {
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // starts a fresh form every time the modal closes (cancelled, closed, or after a successful create)
  const wasOpen = useRef(opened);
  useEffect(() => {
    if (wasOpen.current && !opened) {
      setClientForm?.(EMPTY_FORM);
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
    if (!clientForm.name?.trim()) next.name = "Enter the client's name.";
    const email = clientForm.email?.trim();
    if (email && !EMAIL_PATTERN.test(email)) next.email = "Enter a valid email address.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Enter in any field submits the form
    if (submitting || !validate()) return;
    try {
      setSubmitting(true);
      await submitClientForm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={close}
      title="New client"
      size={560}
      padding={0}
      radius={12}
      // centered
      closeOnClickOutside={!submitting}
      closeOnEscape={!submitting}
      closeButtonProps={{ "aria-label": "Close", disabled: submitting }}
      classNames={{ content: "acm-content" }}
    >
      <form className="acm-form" onSubmit={handleSubmit} noValidate>
        <TextInput
          label="Client name"
          placeholder="Client or company name"
          leftSection={icon(IconUser)}
          leftSectionWidth={SECTION_WIDTH}
          value={clientForm.name}
          onChange={onField("name")}
          error={errors.name}
          dir="auto"
          autoComplete="off"
          data-autofocus
        />

        <div className="acm-row">
          <TextInput
            label="Phone (optional)"
            placeholder="Phone number"
            leftSection={icon(IconPhone)}
            leftSectionWidth={SECTION_WIDTH}
            type="tel"
            inputMode="tel"
            dir="ltr"
            autoComplete="off"
            value={clientForm.phone}
            onChange={onField("phone")}
          />
          <TextInput
            label="Email (optional)"
            placeholder="name@example.com"
            leftSection={icon(IconMail)}
            leftSectionWidth={SECTION_WIDTH}
            type="email"
            inputMode="email"
            dir="ltr"
            autoComplete="off"
            value={clientForm.email}
            onChange={onField("email")}
            error={errors.email}
          />
        </div>

        <TextInput
          label="Location (optional)"
          placeholder="City or neighborhood"
          leftSection={icon(IconMapPin)}
          leftSectionWidth={SECTION_WIDTH}
          value={clientForm.location}
          onChange={onField("location")}
          dir="auto"
          autoComplete="off"
        />

        <div className="acm-footer">
          <button type="button" className="acm-btn" onClick={close} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="acm-btn acm-pri" disabled={submitting}>
            {submitting ? (
              <Loader size={18} color="white" />
            ) : (
              <IconUserPlus size={19} stroke={2} aria-hidden="true" />
            )}
            Create client
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default AddClientModal;