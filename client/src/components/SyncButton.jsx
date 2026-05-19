import { useState } from "react";
import { Button, Group, Text, Badge } from "@mantine/core";
import { IconCloudUpload, IconCloudDownload } from "@tabler/icons-react";
import axios from "axios";

const SyncButton = () => {
  const [pushing, setPushing]   = useState(false);
  const [pulling, setPulling]   = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState(null);

  const token = localStorage.getItem("authToken");
  const BASE_URL = import.meta.env.VITE_URL;

  const pushToCloud = async () => {
    try {
      setPushing(true);
      setError(null);
      const { data } = await axios.post(`${BASE_URL}/sync/to-cloud`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResult(`↑ ${data.synced.sales} مبيعات، ${data.synced.expenses} مصروفات`);
    } catch (e) {
      setError("فشل الرفع: " + e.message);
    } finally {
      setPushing(false);
    }
  };

  const pullFromCloud = async () => {
    try {
      setPulling(true);
      setError(null);
      const { data } = await axios.post(`${BASE_URL}/sync/from-cloud`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResult(`↓ ${data.updated} منتج تم تحديثه`);
    } catch (e) {
      setError("فشل السحب: " + e.message);
    } finally {
      setPulling(false);
    }
  };

  return (
    <Group gap="sm">
      {result && <Badge color="green" radius="xl">{result}</Badge>}
      {error  && <Badge color="red"   radius="xl">{error}</Badge>}

      <Button
        size="sm"
        radius="xl"
        variant="light"
        leftSection={<IconCloudDownload size={16} />}
        loading={pulling}
        onClick={pullFromCloud}
      >
        سحب الأسعار
      </Button>

      <Button
        size="sm"
        radius="xl"
        leftSection={<IconCloudUpload size={16} />}
        loading={pushing}
        onClick={pushToCloud}
      >
        رفع البيانات
      </Button>
    </Group>
  );
};

export default SyncButton;