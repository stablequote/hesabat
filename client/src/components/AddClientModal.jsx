import { Button, Flex, Group, Modal, NumberInput, Stack, Text, TextInput } from '@mantine/core'

function AddClientModal({ opened, setOpened, merchantForm, handleChange, setMerchantForm, submitMerchantForm }) {
  return (
    <Modal size={800} opened={opened} withCloseButton>
        <Stack>
          <TextInput label="Shop Name" 
            placeholder="enter shop name"
            value={merchantForm.shopName} 
            onChange={(e) => handleChange("shopName", e.currentTarget.value)} 
          />
          <TextInput label="Owner's Name" 
            placeholder="enter owner's name"
            value={merchantForm.ownerName} 
            onChange={(e) => handleChange("ownerName", e.currentTarget.value)} 
          />
          <TextInput 
            label="Merchant's Phone" 
            placeholder="enter phone number" 
            value={merchantForm.phone} 
            onChange={(e) => handleChange("phone", e.currentTarget.value)} 
          />
          <TextInput 
            label="Merchant' Location" 
            placeholder="enter merchant's location" 
            value={merchantForm.location} 
            onChange={(e) => handleChange("location", e.currentTarget.value)} 
          />
          <NumberInput 
            label="Unit Sale Price" 
            placeholder='enter unit sale price' 
            value={merchantForm.unitSalePrice} 
            onChange={(val) => handleChange("unitSalePrice", val)}
            removeTrailingZeros
            precision={3}
          />
        </Stack>
        <Flex mt="md" justify="space-between" >
          <Button color="green" onClick={submitMerchantForm}>Create</Button>
          <Button color="gray" onClick={() => setOpened(false)}>Cancel</Button>
        </Flex>
    </Modal>
  )
}

export default AddClientModal;