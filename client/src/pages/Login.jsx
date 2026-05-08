import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Paper, Text, TextInput, Box, Center, Button, PasswordInput, Loader } from '@mantine/core'
import { showNotification } from '@mantine/notifications';
import axios from 'axios'
// import bgImage from '../assets/bgImage.jpg'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const [user, setUser] = useState({
    username: '',
    password: '',
  })
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  return (
    <div>
      <Container size="md" py="lg">
        <Center px="lg">
        <Paper shadow='lg' withBorder py="lg" px={30}>
          <Text fz={26} fw={700}>Hesabat Login</Text>
          <Box>
            <TextInput label="username" placeholder='enter your username' name="username" value={user.username} p={3} onChange={(e) => setUser({ ...user, username: e.target.value })} required />
            <PasswordInput label="password" placeholder='enter your password' name="password" value={user.password} p={3} mb="xs" onChange={(e) => setUser({ ...user, password: e.target.value })} required />
          </Box>
          <Button fullWidth onClick={() => login(user)}>{ loading && <Loader size="sm" color='white' variant="oval"/>} &nbsp; Login</Button>
        </Paper>
        </Center>
      </Container>
    </div>
  )
}

export default Login;