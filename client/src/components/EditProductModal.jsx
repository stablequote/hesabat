import { useEffect, useState } from 'react';
import { Modal, TextInput, NumberInput, Select, Button, Group, FileInput, ActionIcon, Text, Divider, Stack } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';

const idOf = (u) => u?._id ?? u; // works whether the unit is populated or a bare id

export default function EditProductModal({ opened, onClose, product, units = [], onCreateUnit, onSubmit, loading }) {
  const [form, setForm] = useState({ name: '', manufacturer: '', category: '', image: null, levels: [] });
  const [newUnitName, setNewUnitName] = useState('');
  const [creatingUnit, setCreatingUnit] = useState(false);

  useEffect(() => {
    if (!opened || !product) return;
    setForm({
      name: product.name ?? '',
      manufacturer: product.manufacturer ?? '',
      category: product.category ?? '',
      image: null,
      levels: (product.unitLevels ?? []).map((l) => ({
        unit: idOf(l.unit),
        factor: l.factor,
        purchasePrice: l.purchasePrice,
        salePrice: l.salePrice,
        locked: true,
      })),
    });
  }, [opened, product]);

  const unitOptions = units.map((u) => ({ value: u._id, label: u.name }));
  const used = form.levels.map((l) => l.unit).filter(Boolean);
  const baseName = units.find((u) => u._id === form.levels.find((l) => l.factor === 1)?.unit)?.name;

  const setField = (f, v) => setForm((p) => ({ ...p, [f]: v }));
  const setLevel = (i, patch) =>
    setForm((p) => ({ ...p, levels: p.levels.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) }));
  const addLevel = () =>
    setForm((p) => ({ ...p, levels: [...p.levels, { unit: null, factor: 2, purchasePrice: 0, salePrice: 0, locked: false }] }));
  const removeLevel = (i) => setForm((p) => ({ ...p, levels: p.levels.filter((_, idx) => idx !== i) }));

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

  const levelsValid =
    form.levels.every((l) => l.unit && Number.isInteger(Number(l.factor)) && Number(l.factor) >= 1) &&
    new Set(used).size === used.length;

  const handleSubmit = () => {
    if (!form.name.trim() || !levelsValid) return;
    onSubmit(
      {
        name: form.name.trim(),
        manufacturer: form.manufacturer,
        category: form.category,
        unitLevels: form.levels.map((l) => ({
          unit: l.unit,
          factor: Number(l.factor),
          purchasePrice: Number(l.purchasePrice) || 0,
          salePrice: Number(l.salePrice) || 0,
        })),
      },
      form.image
    );
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Product" size="lg" centered>
      <TextInput label="Product Name" value={form.name} required mb="sm"
        onChange={(e) => setField('name', e.target.value)} data-autofocus />
      <TextInput label="Manufacturer" value={form.manufacturer} mb="sm"
        onChange={(e) => setField('manufacturer', e.target.value)} />
      <Select label="Category" searchable mb="sm" value={form.category || null}
        data={['Laboratory Consumables', 'Laboratory Devices', 'Laboratory Equipments']}
        onChange={(v) => setField('category', v ?? '')} />

      <Divider my="md" label="Units" labelPosition="left" />
      <Text size="xs" c="dimmed" mb="sm">
        Existing units and their conversions are locked because stock and past invoices depend on them.
        You can change prices and add new units.
      </Text>

      <Group align="flex-end" mb="md">
        <TextInput label="Need a new unit?" placeholder="e.g. Strip" value={newUnitName}
          onChange={(e) => setNewUnitName(e.target.value)} style={{ flex: 1 }} />
        <Button variant="light" onClick={handleCreateUnit} loading={creatingUnit}>Create unit</Button>
      </Group>

      <Stack gap="sm">
        {form.levels.map((level, i) => (
          <Group key={i} align="flex-end" wrap="nowrap">
            <Select
              label={level.factor === 1 && level.locked ? 'Base unit' : 'Unit'}
              data={unitOptions.filter((o) => o.value === level.unit || !used.includes(o.value))}
              value={level.unit}
              disabled={level.locked}
              onChange={(v) => setLevel(i, { unit: v })}
              style={{ flex: 1 }}
            />
            <NumberInput
              label={level.factor === 1 && level.locked ? 'Contains' : `${baseName || 'base units'} in 1`}
              value={level.factor} min={1} allowDecimal={false} w={140}
              disabled={level.locked}
              onChange={(v) => setLevel(i, { factor: v || 1 })}
            />
            <NumberInput label="Purchase price" value={level.purchasePrice} min={0} w={120}
              onChange={(v) => setLevel(i, { purchasePrice: v || 0 })} />
            <NumberInput label="Sale price" value={level.salePrice} min={0} w={120}
              onChange={(v) => setLevel(i, { salePrice: v || 0 })} />
            {!level.locked && (
              <ActionIcon color="red" variant="light" mb={4} onClick={() => removeLevel(i)}>
                <IconTrash size={18} />
              </ActionIcon>
            )}
          </Group>
        ))}
      </Stack>
      <Button variant="subtle" mt="sm" onClick={addLevel}>+ Add another unit</Button>

      <FileInput label="Replace image (optional)" accept="image/*" mt="md" value={form.image}
        onChange={(v) => setField('image', v)} />

      {!levelsValid && (
        <Text size="xs" c="red" mt="sm">Each unit must be selected once, with a whole-number conversion.</Text>
      )}

      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} loading={loading} disabled={!form.name.trim() || !levelsValid}>Save</Button>
      </Group>
    </Modal>
  );
}