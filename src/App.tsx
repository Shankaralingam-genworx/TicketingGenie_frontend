import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import store from './app/store';
import AppRoutes from './app/AppRoutes';
import { bootstrapAuth } from './features/auth';
import { useAppDispatch } from './hooks/useAppDispatch';

const AppInitializer: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(bootstrapAuth());
  }, [dispatch]);

  return <AppRoutes />;
};

const App: React.FC = () => (
  <Provider store={store}>
    <AppInitializer />
  </Provider>
);

export default App;