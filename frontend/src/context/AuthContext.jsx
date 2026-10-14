import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [manager, setManager] = useState(() => {
    try {
      const savedUser = localStorage.getItem('managerUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('managerToken') || null;
  });

  const login = (authToken, user) => {
    setToken(authToken);
    setManager(user);
    localStorage.setItem('managerToken', authToken);
    localStorage.setItem('managerUser', JSON.stringify(user));
  };

  const logout = () => {
    setToken(null);
    setManager(null);
    localStorage.removeItem('managerToken');
    localStorage.removeItem('managerUser');
  };

  const isAuthenticated = !!token && !!manager;

  return (
    <AuthContext.Provider
      value={{
        manager,
        token,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
