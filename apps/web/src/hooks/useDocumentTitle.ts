import { useEffect } from "react";
import { getAppName } from "../lib/app-name.ts";

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title;
    return () => {
      document.title = getAppName();
    };
  }, [title]);
}
