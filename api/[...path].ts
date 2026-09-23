import { app } from "../apps/api/src/app.js";

export const config = {
  runtime: "nodejs",
  maxDuration: 30,
};

function handle(request: Request): Response | Promise<Response> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api")) {
    url.pathname = `/api${url.pathname}`;
    return app.fetch(new Request(url, request));
  }
  return app.fetch(request);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
