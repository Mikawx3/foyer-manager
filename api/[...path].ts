import type { IncomingMessage, ServerResponse } from "node:http";
import { app } from "../apps/api/src/app.js";

export const config = {
  maxDuration: 30,
};

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const host = req.headers.host ?? "localhost";
  const forwarded = req.headers["x-forwarded-proto"];
  const proto = typeof forwarded === "string" ? forwarded : "https";
  const url = new URL(req.url ?? "/api", `${proto}://${host}`);
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
