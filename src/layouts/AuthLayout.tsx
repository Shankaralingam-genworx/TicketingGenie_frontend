import React from 'react';

const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="auth-layout">{children}</div>
);

export default AuthLayout;
