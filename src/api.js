import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_URL = "https://kbapp-backend.onrender.com/api";

const authFetch = async (endpoint, options = {}) => {
  const token = await AsyncStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: "Bearer " + token } : {}),
    ...options.headers,
  };
  try {
    const res = await fetch(API_URL + endpoint, { ...options, headers });
    return res.json();
  } catch (e) {
    console.error("API error:", e);
    return { message: "Erreur de connexion" };
  }
};

export const registerUser = (email, password, termsAccepted) =>
  authFetch("/users/register", {
    method: "POST",
    body: JSON.stringify({ email, password, termsAccepted }),
  });

export const loginUser = (email, password) =>
  authFetch("/users/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const getEvents = () => authFetch("/events");
export const getEvent = (id) => authFetch("/events/" + id);

export const createEvent = (data) =>
  authFetch("/events/create", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const deleteEvent = (id) =>
  authFetch("/events/" + id, { method: "DELETE" });

export const getAdminStats = () => authFetch("/events/admin/stats");

export const buyTicket = (eventId) =>
  authFetch("/tickets/buy", {
    method: "POST",
    body: JSON.stringify({ eventId }),
  });

export const getMyTickets = () => authFetch("/tickets");

export const initiatePayment = (eventId, phone, method) =>
  authFetch("/payments/initiate", {
    method: "POST",
    body: JSON.stringify({ eventId, phone, method }),
  });

export const getPaymentStatus = (paymentId) =>
  authFetch("/payments/status/" + paymentId);

export const getMerchantCodes = () => authFetch("/payments/merchant-codes");

export const cacheTickets = async (tickets) => {
  await AsyncStorage.setItem("cached_tickets", JSON.stringify(tickets));
};

export const getCachedTickets = async () => {
  try {
    const data = await AsyncStorage.getItem("cached_tickets");
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

export const cacheEvents = async (events) => {
  await AsyncStorage.setItem("cached_events", JSON.stringify(events));
};

export const getCachedEvents = async () => {
  try {
    const data = await AsyncStorage.getItem("cached_events");
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

export const checkPendingPayment = (eventId) =>
  authFetch("/payments/pending/" + eventId);

export const deleteAccount = () =>
  authFetch("/users/delete-account", { method: "DELETE" });

export const confirmOrangePayment = (paymentId, transactionId) =>
  authFetch("/payments/confirm-orange", {
    method: "POST",
    body: JSON.stringify({ paymentId, transactionId }),
  });