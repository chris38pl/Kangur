import { createRouteHandler } from "uploadthing/next";

import { feedbackFileRouter } from "./core";

export const { GET, POST } = createRouteHandler({
  router: feedbackFileRouter,
});
