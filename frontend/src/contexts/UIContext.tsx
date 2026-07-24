import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
  isNotificationsOpen: boolean;
  openNotifications: () => void;
  closeNotifications: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <UIContext.Provider
      value={{
        isNotificationsOpen,
        openNotifications: () => setIsNotificationsOpen(true),
        closeNotifications: () => setIsNotificationsOpen(false),
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
