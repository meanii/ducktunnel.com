import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './root';
import { VoiceChatPage } from '../components/VoiceChatPage';

export const roomRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$roomName',
  component: VoiceChatPage,
});
