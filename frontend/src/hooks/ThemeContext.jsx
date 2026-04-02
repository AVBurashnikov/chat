/**
 * Theme context for light/dark mode
 */

import { createContext, useContext } from 'react';

export const ThemeContext = createContext('dark');

export const useTheme = () => useContext(ThemeContext);
