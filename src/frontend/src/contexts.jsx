import { createContext } from "react";

// null = loading, {} = loaded (empty = no explicit restrictions)
export const PermissionsContext = createContext(null);
