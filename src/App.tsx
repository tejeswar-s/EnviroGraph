import React from 'react';
import { Provider } from 'react-redux';
import { ConfigProvider, App as AntApp } from 'antd';
import { store } from './store';
import Dashboard from './components/Dashboard';
import './App.css';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 6,
          },
        }}
      >
        <AntApp>
          <Dashboard />
        </AntApp>
      </ConfigProvider>
    </Provider>
  );
};

export default App;
