import { createRouteHandler } from 'uploadthing/next';
import { ourFileRouter } from './core';

// экспортируем обработчики GET и POST для роутера
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});