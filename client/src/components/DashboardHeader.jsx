import React from "react";
import {
  AppShell,
  Text,
  Title,
  Group,
  ActionIcon,
  useMantineTheme,
  Input,
  Select,
  Flex,
  Container,
} from "@mantine/core";
import { IconSearch, IconBell, IconUser } from "@tabler/icons-react";
import moment from "moment";

const DashboardHeader = ({changeLanguage, value, shiftRemainingTime}) => {
  const theme = useMantineTheme();
  return (
    <Container height={60}  p="md" sx={{backgroundColor: "#1D242E", color: "white"}} >
      <Flex justify="space-between">
        <Text color="white" fw="bold">Soapy</Text>
        
        {/* <Group>
          <Input
            placeholder="Search for anything here"
            icon={<IconSearch size={16} />}
            sx={{ width: 300 }}
          />
        </Group> */}

        {/* Right side: Date, time, and icons */}
        <Group>
          <Select
            data={[
              {value: "en", label: "English"},
              {value: "ar", label: "Arabic"}
            ]}
            placeholder="Language"
            defaultValue="English"
            value={value}
            onChange={changeLanguage}
          />
          <Text>{moment(Date.now()).format('DD-MMMM-YYYY h:mm A')}</Text>
          <ActionIcon onClick={() => alert("Notifications feature is coming soom...")}>
            <IconBell size={20} />
          </ActionIcon>
          <ActionIcon onClick={() => alert("Profile management is coming soon...")}>
            <IconUser size={20} />
          </ActionIcon>
          <Text color="white">{shiftRemainingTime}</Text>
        </Group>
      </Flex>
    </Container>
  );
};

export default DashboardHeader;