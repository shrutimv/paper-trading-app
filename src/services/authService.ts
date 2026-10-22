import { BASE_URL } from "@/src/config/api";
import axios from "axios";

export async function getCurrentUser() {
    const response = await axios.get(
        `${BASE_URL}/api/auth/me`,
        {
            withCredentials: true,
        }
    );

    return response.data.user;
}