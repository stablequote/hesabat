import { Button, Flex, Group, Modal, NumberInput, Stack, Text, TextInput } from '@mantine/core'

function AddVendorModal({ opened, setOpened, vendorForm, handleChange, setVendorForm, submitVendorForm }) {
  return (
    <Modal size={800} opened={opened} withCloseButton>
        <Stack>
          <TextInput 
            label="Vendor Name" 
            placeholder="enter vendor's name"
            value={vendorForm.name} 
            onChange={(e) => handleChange("name", e.currentTarget.value)} 
          />
          <TextInput 
            label="Vendor ID" 
            placeholder="enter vendor ID"
            value={vendorForm.vendorID} 
            onChange={(e) => handleChange("vendorID", e.currentTarget.value)} 
          />
          <TextInput 
            label="vendor's Phone" 
            placeholder="enter phone number" 
            value={vendorForm.phone} 
            onChange={(e) => handleChange("phone", e.currentTarget.value)} 
          />
          <TextInput 
            label="vendor' Location" 
            placeholder="enter vendor's location" 
            value={vendorForm.location} 
            onChange={(e) => handleChange("location", e.currentTarget.value)} 
          />
        </Stack>
        <Flex mt="md" justify="space-between" >
          <Button color="green" onClick={submitVendorForm}>Create</Button>
          <Button color="gray" onClick={() => setOpened(false)}>Cancel</Button>
        </Flex>
    </Modal>
  )
}

export default AddVendorModal;