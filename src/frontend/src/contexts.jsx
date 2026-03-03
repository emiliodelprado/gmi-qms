import { createContext } from "react";

// null = loading, {} = loaded (empty = no explicit restrictions)
export const PermissionsContext = createContext(null);

// Global solicitud drawer — open(defaultPantalla), prevScreenLabel, user
export const SolicitudContext = createContext({ open: () => {}, prevScreenLabel: "", user: null });
