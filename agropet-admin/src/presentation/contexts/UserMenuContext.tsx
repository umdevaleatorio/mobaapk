import React, { createContext, useState, useContext } from 'react';

interface UserMenuContextData {
  isMenuVisible: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;
}

const UserMenuContext = createContext<UserMenuContextData>({} as UserMenuContextData);

export const UserMenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const toggleMenu = () => setIsMenuVisible(!isMenuVisible);
  const closeMenu = () => setIsMenuVisible(false);

  return (
    <UserMenuContext.Provider value={{ isMenuVisible, toggleMenu, closeMenu }}>
      {children}
    </UserMenuContext.Provider>
  );
};

export const useUserMenu = () => useContext(UserMenuContext);
