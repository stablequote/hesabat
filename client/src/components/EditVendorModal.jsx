import { Modal, TextInput, Button, Group, Stack } from '@mantine/core';

function EditVendorModal({
  opened,
  onClose,
  editForm,
  handleChange,
  onSubmit,
  loading,
}) {
  return (
    <Modal opened={opened} onClose={onClose} title="Edit Vendor" centered>
      <Stack>
        <TextInput
          label="Vendor Name"
          value={editForm.name}
          onChange={(e) => handleChange('name', e.currentTarget.value)}
          required
          data-autofocus
        />
        <TextInput
          label="Vendor ID"
          value={editForm.vendorID}
          onChange={(e) => handleChange('vendorID', e.currentTarget.value)}
        />
        <TextInput
          label="Location"
          value={editForm.location}
          onChange={(e) => handleChange('location', e.currentTarget.value)}
        />
        <TextInput
          label="Phone"
          value={editForm.phone}
          onChange={(e) => handleChange('phone', e.currentTarget.value)}
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button color="blue" onClick={onSubmit} loading={loading}>
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export default EditVendorModal;