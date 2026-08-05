import { handlers } from "@/auth";

// Auth.js v5 catch-all route handler.
// Exposes /api/auth/* (signin, signout, callback/google, session, csrf, etc.)
export const { GET, POST } = handlers;
