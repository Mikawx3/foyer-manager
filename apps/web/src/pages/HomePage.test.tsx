import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { DeploymentModeProvider } from "../contexts/DeploymentModeContext.tsx";
import "../i18n.ts";
import { HomePage } from "./HomePage.tsx";

function renderHome(): string {
  // The config query never resolves: this is the first client render, before /api/config answers.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, queryFn: () => new Promise<never>(() => {}) } },
  });
  return renderToString(
    <QueryClientProvider client={queryClient}>
      <DeploymentModeProvider>
        <MemoryRouter initialEntries={["/en"]}>
          <HomePage />
        </MemoryRouter>
      </DeploymentModeProvider>
    </QueryClientProvider>,
  );
}

describe("HomePage", () => {
  it("renders the landing while the deployment config is still loading", () => {
    const html = renderHome();
    expect(html).toContain("<h1");
    expect(html).toContain('href="/households/new"');
    expect(html).not.toContain("animate-pulse");
  });
});
