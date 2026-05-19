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
  Box,
} from "@mantine/core";
import { IconSearch, IconBell, IconUser } from "@tabler/icons-react";
import moment from "moment";
import SyncButton from './SyncButton';

const DashboardHeader = ({changeLanguage, value, shiftRemainingTime}) => {
  const theme = useMantineTheme();
  return (
    <Box height={60}  p="md" style={{backgroundColor: "#71a0e2", color: "white"}} >
      <Flex justify="space-between">
        <Text color="orange" fz={32} fw="bold" ff="monospace" style={{ lineHeight: "1rem",  }}>حسابات</Text>

        {/* Right side: Date, time, and icons */}
        <Group>
          <SyncButton />
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
    </Box>
  );
};

export default DashboardHeader;