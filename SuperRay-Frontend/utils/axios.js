import axios from "axios";
import { BACKEND_URL } from "./config";

export const DEFAULT_TIMEOUT_MS = 30_000;
export const INFERENCE_TIMEOUT_MS = 150_000;

const api = axios.create({ baseURL: BACKEND_URL, timeout: DEFAULT_TIMEOUT_MS });

export const axiosAuth = axios.create({ baseURL: BACKEND_URL, timeout: DEFAULT_TIMEOUT_MS });

export default api;
