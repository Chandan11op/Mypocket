import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { settingsApi } from '../services';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('mypocket_theme') || 'system';
  });

  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('mypocket_currency') || 'INR';
  });

  const [dateFormat, setDateFormat] = useState(() => {
    return localStorage.getItem('mypocket_date_format') || 'DD/MM/YYYY';
  });

  const [themeColor, setThemeColor] = useState(() => {
    return localStorage.getItem('mypocket_theme_color') || 'emerald';
  });

  // Apply dark/light class to <html> element
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (isDark) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (theme === 'dark') {
      applyTheme(true);
    } else if (theme === 'light') {
      applyTheme(false);
    } else {
      // System appearance
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark);
    }

    localStorage.setItem('mypocket_theme', theme);
  }, [theme]);

  // Load server-side settings on login/mount
  const fetchServerSettings = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const res = await settingsApi.getSettings();
      if (res.data.success && res.data.data.settings) {
        const s = res.data.data.settings;
        if (s.theme) {
          setTheme(s.theme);
          localStorage.setItem('mypocket_theme', s.theme);
        }
        if (s.currency) {
          setCurrency(s.currency);
          localStorage.setItem('mypocket_currency', s.currency);
        }
        if (s.date_format) {
          setDateFormat(s.date_format);
          localStorage.setItem('mypocket_date_format', s.date_format);
        }
        if (s.theme_color) {
          setThemeColor(s.theme_color);
          localStorage.setItem('mypocket_theme_color', s.theme_color);
        }
      }
    } catch (err) {
      // Ignore 401 or network errors during unauthenticated states
    }
  }, []);

  useEffect(() => {
    fetchServerSettings();
  }, [fetchServerSettings]);

  const updateTheme = async (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('mypocket_theme', newTheme);
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        await settingsApi.updateSettings({ theme: newTheme });
      }
    } catch (err) {
      console.warn('Failed to sync theme to backend:', err);
    }
  };

  const updateCurrency = async (newCurrency) => {
    setCurrency(newCurrency);
    localStorage.setItem('mypocket_currency', newCurrency);
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        await settingsApi.updateSettings({ currency: newCurrency });
      }
    } catch (err) {
      console.warn('Failed to sync currency to backend:', err);
    }
  };

  const updateDateFormat = async (newFormat) => {
    setDateFormat(newFormat);
    localStorage.setItem('mypocket_date_format', newFormat);
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        await settingsApi.updateSettings({ date_format: newFormat });
      }
    } catch (err) {
      console.warn('Failed to sync date format to backend:', err);
    }
  };

  const updateThemeColor = async (newColor) => {
    setThemeColor(newColor);
    localStorage.setItem('mypocket_theme_color', newColor);
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        await settingsApi.updateSettings({ theme_color: newColor });
      }
    } catch (err) {
      console.warn('Failed to sync theme color to backend:', err);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        updateTheme,
        currency,
        updateCurrency,
        dateFormat,
        updateDateFormat,
        themeColor,
        updateThemeColor,
        fetchServerSettings,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
