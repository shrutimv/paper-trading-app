import { BASE_URL } from "@/src/config/api";
import axios from "axios";

export const getHoldings = async () => {
  const response = await axios.get(
    `${BASE_URL}/api/trade/holdings`,
    {
      withCredentials: true,
    }
  );

  return response.data;
};