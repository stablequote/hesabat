import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

export default function useUnits() {
  const BASE_URL = import.meta.env.VITE_URL;
  const [units, setUnits] = useState([]);

  useEffect(() => {
    axios.get(`${BASE_URL}/units/list`).then((res) => setUnits(res.data.units)).catch(() => {});
  }, [BASE_URL]);

  const createUnit = useCallback(async (name) => {
    const res = await axios.post(`${BASE_URL}/units/create`, { name });
    setUnits((prev) => [...prev, res.data.unit]);
    return res.data.unit;
  }, [BASE_URL]);

  return { units, createUnit };
}