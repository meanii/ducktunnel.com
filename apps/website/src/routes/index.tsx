import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './root';
import { Home } from '../components/Home';

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
});
