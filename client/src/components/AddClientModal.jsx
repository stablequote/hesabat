import { Button, Flex, Group, Modal, NumberInput, Stack, Text, TextInput } from '@mantine/core'

function AddClientModal({ opened, setOpened, clientForm, handleChange, setClientForm, submitClientForm }) {
  return (
    <Modal size={800} opened={opened} withCloseButton>
        <Stack>
          <TextInput label="Client Name" 
            placeholder="enter client's name"
            value={clientForm.name} 
            onChange={(e) => handleChange("name", e.target.value)} 
          />
          <TextInput 
            label="Client's Phone" 
            placeholder="enter phone number" 
            value={clientForm.phone} 
            onChange={(e) => handleChange("phone", e.target.value)} 
          />
          <TextInput 
            label="Client Location" 
            placeholder="enter client's location" 
            value={clientForm.location} 
            onChange={(e) => handleChange("location", e.target.value)} 
          />
          <TextInput 
            label="Client's Email" 
            placeholder="enter email address" 
            value={clientForm.email} 
            onChange={(e) => handleChange("email", e.target.value)} 
          />
        </Stack>
        <Flex mt="md" justify="space-between" >
          <Button color="green" onClick={submitClientForm}>Create</Button>
          <Button color="gray" onClick={() => setOpened(false)}>Cancel</Button>
        </Flex>
    </Modal>
  )
}

export default AddClientModal;