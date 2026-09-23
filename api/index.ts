import type { IncomingMessage, ServerResponse } from "node:http";
import { app } from "../apps/api/src/app.js";

export const config = {
  maxDuration: 30,
};

function headerValue(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  return value?.[0];
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const host = req.headers.host ?? "localhost";
  const proto = headerValue(req.headers["x-forwarded-proto"]) ?? "https";
  const url = new URL(req.url ?? "/api", `${proto}://${host}`);
  const route = url.searchParams.get("__route");
  if (route !== null) {
    url.pathname = `/api/${route}`;
    url.searchParams.delete("__route");
  }

  const method = req.method ?? "GET";
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const body = Buffer.concat(chunks);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") {
      headers.set(key, value);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item);
      }
    }
  }

  const request = new Request(url, {
    method,
    headers,
    body: method === "GET" || method === "HEAD" || body.length === 0 ? undefined : body,
  });

  const response = await app.fetch(request);
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  res.end(Buffer.from(await response.arrayBuffer()));
}
