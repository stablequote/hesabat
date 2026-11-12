import { Modal, TextInput, Button, Group, Stack } from '@mantine/core';

function EditClientModal({
  opened,
  onClose,
  editForm,
  handleChange,
  onSubmit,
  loading,
}) {
  return (
    <Modal opened={opened} onClose={onClose} title="Edit Client" centered>
      <Stack>
        <TextInput
          label="Client Name"
          value={editForm.name}
          onChange={(e) => handleChange('name', e.currentTarget.value)}
          required
          data-autofocus
        />
        <TextInput
          label="Phone"
          value={editForm.phone}
          onChange={(e) => handleChange('phone', e.currentTarget.value)}
        />
        <TextInput
          label="Location"
          value={editForm.location}
          onChange={(e) => handleChange('location', e.currentTarget.value)}
        />
        <TextInput
          label="Email"
          value={editForm.email}
          onChange={(e) => handleChange('email', e.currentTarget.value)}
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

export default EditClientModal;