import { Button, Container, Modal, NumberInput, Select, TextInput } from '@mantine/core';

function AddExpenseModal({ open, setOpen, expenseForm, handleChange, handleSubmit }) {
  return (
    <Modal title="Add Expense" size={600} opened={open} onClose={() => setOpen(!open)}>
      <Modal.Body>
        <Container size="lg">
          <NumberInput 
            label="Amount" 
            placeholder='type amount' 
            name="amount"
            required
            value={expenseForm.amount} 
            onChange={(val) => handleChange("amount", val)}
            hideControls
          />
          <TextInput
            mt="md"
            label="Description" 
            placeholder='type note' 
            name='description' 
            value={expenseForm.description} 
            onChange={(e) => handleChange("description", e.currentTarget.value)} 
          />
          <Select 
            mt="md"
            label="Payment Method"
            placeholder="Pick payment method"
            required
            data={["Cash", "Bankak"]}
            value={expenseForm.paymentMethod}
            onChange={(val) => handleChange("paymentMethod", val)}
          />
          <Button mt="md" onClick={handleSubmit}>Create</Button>
        </Container>
      </Modal.Body>
    </Modal>
  )
}

export default AddExpenseModal;