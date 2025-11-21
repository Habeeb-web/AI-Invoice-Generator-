export const BASE_URL = "https://ai-invoice-generator-mtkn.onrender.com";

export const API_PATHS = {
  USER:{
    PROFILE: '/api/user/profile',
  },
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    GET_PROFILE: "/api/auth/me",
    UPDATE_PROFILE: "/api/auth/me",
  },

  INVOICE: {
    CREATE_INVOICE: "/api/invoices",
    GET_ALL_INVOICES: "/api/invoices",
    GET_INVOICE_BY_ID: (id) => `/api/invoices/${id}`,
    UPDATE_INVOICE: (id) => `/api/invoices/${id}`,
    DELETE_INVOICE: (id) => `/api/invoices/${id}`,
    UPDATE_INVOICE_STATUS: (id) => `/api/invoices/${id}/status`,
  },

  AI: {
    PARSE_INVOICE_TEXT: "/api/ai/parse-invoice",
    GENERATE_REMINDER: "/api/ai/generate-reminder-email",
    GET_DASHBOARD_SUMMARY: "/api/ai/dashboard-summary",
    CREATE_INVOICE_FROM_TEXT: "/api/ai/create-invoice",
  },
};
