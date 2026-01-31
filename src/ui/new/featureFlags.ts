const flagValue = import.meta.env.VITE_USE_NEW_MOBILE_UI;

export const USE_NEW_MOBILE_UI = flagValue ? flagValue === "true" : true;
