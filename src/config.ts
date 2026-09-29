// Base URL of the API gateway. Empty in local dev, where the Vite proxy
// handles /api/* on the same origin. In Azure it is set at build time.
export const GATEWAY_URL: string = import.meta.env.VITE_GATEWAY_URL || '';
