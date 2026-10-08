declare global {
  interface Window { __TAURI_INTERNALS__?: unknown }
}

import { StrictMode } from 'react';
import { Provider } from 'react-redux';
import { createRoot } from 'react-dom/client';
import { Outlet, RouterProvider, createBrowserRouter, createHashRouter } from 'react-router';

import App from './app';
import { store } from './state';
import { routesSection } from './routes/sections';
import { ErrorBoundary } from './routes/components';

// ----------------------------------------------------------------------

const makeRouter = window.__TAURI_INTERNALS__ ? createHashRouter : createBrowserRouter;

const router = makeRouter([
  {
    Component: () => (
      <App>
        <Outlet />
      </App>
    ),
    errorElement: <ErrorBoundary />,
    children: routesSection,
  },
]);

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>
);
