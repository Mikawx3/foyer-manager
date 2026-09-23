import type { BeforeSendEvent } from "@vercel/analytics/react";

const HOUSEHOLD_ID_IN_PATH = /\/households\/(?!new(?:\/|$))[^/]+/g;

export function redactAnalyticsEvent(event: BeforeSendEvent): BeforeSendEvent | null {
  let url: URL;
  try {
    url = new URL(event.url);
  } catch {
    return null;
  }

  url.pathname = url.pathname.replace(HOUSEHOLD_ID_IN_PATH, "/households/[id]");
  url.search = "";
  url.hash = "";

  return {
    ...event,
    url: url.toString(),
  };
}
