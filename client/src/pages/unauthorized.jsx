import { Container } from '@mantine/core'
import React from 'react'

function UnAuthorized() {
  return (
    <Container size="md">
      <h2>UnAuthorized</h2>
      <div>Sorry, you are not authorized to visit this page</div>
    </Container>
  )
}

export default UnAuthorized