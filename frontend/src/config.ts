// Base URL of the ChatSphere.Api backend. Override at build time with a
// VITE_API_BASE_URL environment variable if the API isn't running on the default port.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5082';
export const HUB_URL = `${API_BASE_URL}/hubs/chat`;
export const ROOMS_URL = `${API_BASE_URL}/api/rooms`;
