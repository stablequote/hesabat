import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Paper, Text, TextInput, Box, Center, Button, PasswordInput, Loader } from '@mantine/core'
import axios from 'axios'
import { showNotification } from '@mantine/notifications'
// import bgImage from '../assets/bgImage.jpg'

const Login = () => {
  const [user, setUser] = useState({
    username: '',
    password: '',
  })
  const [loading, setLoading] = useState(false);

  const BASE_URL = import.meta.env.VITE_URL;
  const navigate = useNavigate();

  // login function
  const handleLogin = async () => {
    const url = `${BASE_URL}/auth/login`
    const credentials = user;

    try {
      setLoading(!loading)
      const res = await axios.post(url, credentials);
      if(res.status === 200) {
        localStorage.setItem("authToken", res.data.token);
        localStorage.setItem("shiftEndTime", res.data.shiftEndTime);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setLoading(!loading)
        navigate("/pos"); // Redirect to dashboard after login
      } else if (res.status === 401) {
        showNotification({
          title: "Credentials error",
          message: "credentials are not correct, please try again",
          color: "red",
        })
      } else {
        console.log("error")
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification({
        title: "Login error!",
        message: "Login error, check again",
        color: "red"
      })
    } finally {
      setLoading(false)
    }
  }

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
          <Button fullWidth onClick={() => handleLogin()}>{ loading && <Loader size="sm" color='white' variant="oval"/>} &nbsp; Login</Button>
        </Paper>
        </Center>
      </Container>
    </div>
  )
}

export default Login;