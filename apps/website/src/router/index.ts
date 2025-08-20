import { createRouter } from '@tanstack/react-router';
import { rootRoute } from '../routes/root';
import { indexRoute } from '../routes/index';
import { roomRoute } from '../routes/room';

// Create the route tree
const routeTree = rootRoute.addChildren([indexRoute, roomRoute]);

// Create and export the router
export const router = createRouter({ routeTree });
