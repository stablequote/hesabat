import { useState } from 'react';
import { Modal, TextInput, NumberInput, Select, Button, Group, FileInput, ActionIcon, Text, Divider, Stack } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';

const emptyLevel = () => ({ unit: null, factor: 1, purchasePrice: 0, salePrice: 0 });
const initialForm = () => ({
  name: '', manufacturer: '', category: '', image: null,
  levels: [emptyLevel()], // levels[0] is always the base unit (factor 1)
  openingUnit: null, openingQuantity: 0,
});

export default function AddProductModal({ opened, setOpened, onSubmit, units = [], onCreateUnit }) {
  const [form, setForm] = useState(initialForm());
  const [newUnitName, setNewUnitName] = useState('');
  const [creatingUnit, setCreatingUnit] = useState(false);

  const unitOptions = units.map((u) => ({ value: u._id, label: u.name }));
  const unitName = (id) => units.find((u) => u._id === id)?.name;
  const baseName = unitName(form.levels[0].unit);

  const setField = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const setLevel = (i, patch) =>
    setForm((p) => ({ ...p, levels: p.levels.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) }));
  const addLevel = () => setForm((p) => ({ ...p, levels: [...p.levels, { ...emptyLevel(), factor: 2 }] }));
  const removeLevel = (i) =>
    setForm((p) => ({ ...p, levels: p.levels.filter((_, idx) => idx !== i), openingUnit: null }));

  const handleCreateUnit = async () => {
    if (!newUnitName.trim() || !onCreateUnit) return;
    setCreatingUnit(true);
    try {
      await onCreateUnit(newUnitName.trim());
      setNewUnitName('');
    } finally {
      setCreatingUnit(false);
    }
  };

  const usedUnitIds = form.levels.map((l) => l.unit).filter(Boolean);
  const levelsValid =
    form.levels.every((l) => l.unit && Number.isInteger(Number(l.factor)) && Number(l.factor) >= 1) &&
    new Set(usedUnitIds).size === usedUnitIds.length;

  const handleSubmit = () => {
    if (!form.name.trim() || !levelsValid) return;

    const payload = {
      name: form.name.trim(),
      manufacturer: form.manufacturer,
      category: form.category,
      unitLevels: form.levels.map((l, i) => ({
        unit: l.unit,
        factor: i === 0 ? 1 : Number(l.factor),
        purchasePrice: Number(l.purchasePrice) || 0,
        salePrice: Number(l.salePrice) || 0,
      })),
      ...(Number(form.openingQuantity) > 0 && form.openingUnit
        ? { openingStock: { unit: form.openingUnit, quantity: Number(form.openingQuantity) } }
        : {}),
    };

    onSubmit(payload, form.image); // the parent decides JSON vs FormData
    setForm(initialForm());
    setOpened(false);
  };

  return (
    <Modal opened={opened} onClose={() => setOpened(false)} title="Add New Product" size="lg" centered>
      <TextInput label="Product Name" value={form.name} required mb="sm"
        onChange={(e) => setField('name', e.target.value)} />
      <TextInput label="Manufacturer" value={form.manufacturer} mb="sm"
        onChange={(e) => setField('manufacturer', e.target.value)} />
      <Select label="Category" searchable mb="sm" value={form.category}
        data={['Laboratory Consumables', 'Laboratory Devices', 'Laboratory Equipments']}
        onChange={(v) => setField('category', v)} />

      <Divider my="md" label="Units" labelPosition="left" />

      <Group align="flex-end" mb="md">
        <TextInput label="Need a new unit?" placeholder="e.g. Strip" value={newUnitName}
          onChange={(e) => setNewUnitName(e.target.value)} style={{ flex: 1 }} />
        <Button variant="light" onClick={handleCreateUnit} loading={creatingUnit}>Create unit</Button>
      </Group>

      <Stack gap="sm">
        {form.levels.map((level, i) => (
          <Group key={i} align="flex-end" wrap="nowrap">
            <Select
              label={i === 0 ? 'Base unit (smallest you sell)' : 'Unit'}
              data={unitOptions.filter((o) => o.value === level.unit || !usedUnitIds.includes(o.value))}
              value={level.unit}
              onChange={(v) => setLevel(i, { unit: v })}
              style={{ flex: 1 }}
            />
            {i === 0 ? (
              <NumberInput label="Contains" value={1} disabled w={110} />
            ) : (
              <NumberInput
                label={`${baseName || 'base units'} in 1`}
                value={level.factor} min={1} allowDecimal={false} w={140}
                onChange={(v) => setLevel(i, { factor: v || 1 })}
              />
            )}
            <NumberInput label="Purchase price" value={level.purchasePrice} min={0} w={120}
              onChange={(v) => setLevel(i, { purchasePrice: v || 0 })} />
            <NumberInput label="Sale price" value={level.salePrice} min={0} w={120}
              onChange={(v) => setLevel(i, { salePrice: v || 0 })} />
            {i > 0 && (
              <ActionIcon color="red" variant="light" mb={4} onClick={() => removeLevel(i)}>
                <IconTrash size={18} />
              </ActionIcon>
            )}
          </Group>
        ))}
      </Stack>
      <Button variant="subtle" mt="sm" onClick={addLevel}>+ Add another unit</Button>

      <Divider my="md" label="Opening stock (optional)" labelPosition="left" />
      <Group align="flex-end">
        <Select label="Unit" value={form.openingUnit} style={{ flex: 1 }}
          data={unitOptions.filter((o) => usedUnitIds.includes(o.value))}
          onChange={(v) => setField('openingUnit', v)} />
        <NumberInput label="Quantity" value={form.openingQuantity} min={0}
          onChange={(v) => setField('openingQuantity', v || 0)} />
      </Group>

      <FileInput label="Product Image" accept="image/*" mt="md" value={form.image}
        onChange={(v) => setField('image', v)} />

      {!levelsValid && (
        <Text size="xs" c="red" mt="sm">Each unit must be selected once, with a whole-number conversion.</Text>
      )}

      <Group justify="flex-end" mt="lg">
        <Button variant="light" onClick={() => setOpened(false)}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!form.name.trim() || !levelsValid}>Add Product</Button>
      </Group>
    </Modal>
  );
}