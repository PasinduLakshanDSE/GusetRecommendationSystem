export type StaffSession = { token: string; user: { id: string; fullName: string; email: string; role: "admin" | "staff"; department: string } };
const key = "guestAiStaffSession";
export const getSession = (): StaffSession | null => { try { return JSON.parse(sessionStorage.getItem(key) || "null"); } catch { return null; } };
export const saveSession = (session: StaffSession) => sessionStorage.setItem(key, JSON.stringify(session));
export const clearSession = () => sessionStorage.removeItem(key);
export const authHeaders = (): Record<string, string> => {
  const token = getSession()?.token;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};
