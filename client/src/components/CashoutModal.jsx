import { Button, Flex, Modal, NumberInput, TextInput } from '@mantine/core'

function CashoutModal({ opened, setCashModal, cashForm, handleChange, giveCash }) {
  return (
     <Modal opened={opened} onClose={() => setCashModal(false)} title="Give cash">
        <NumberInput
            label="Amount"
            value={cashForm.amount}
            onChange={(val) => handleChange("amount", val)}
            hideControls
            required
        />
        <TextInput
            mt="md"
            label="Description"
            placeholder="write description"
            value={cashForm.description}
            onChange={(e) => handleChange("description", e.currentTarget.value)}
            required
        />
        <Flex justify="space-between" mt="md">
            <Button color="yellow" onClick={giveCash}>Confirm</Button>
            <Button variant="outline" onClick={() => setCashModal(false)}>Cancel</Button>
        </Flex>
    </Modal>
  )
}

export default CashoutModal