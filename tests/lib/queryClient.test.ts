/**
 * Tests for QueryClient configuration.
 */

import { describe, it, expect } from "vitest";
import { queryClient, createTestQueryClient } from "@/lib/queryClient";

describe("queryClient", () => {
  it("is a QueryClient instance", () => {
    expect(queryClient).toBeDefined();
    expect(typeof queryClient.getQueryCache).toBe("function");
    expect(typeof queryClient.getMutationCache).toBe("function");
  });

  it("has default options configured", () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries).toBeDefined();
  });

  it("has stale time set to 5 minutes", () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries?.staleTime).toBe(5 * 60 * 1000);
  });

  it("has gc time set to 30 minutes", () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries?.gcTime).toBe(30 * 60 * 1000);
  });

  it("has retry set to 3", () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries?.retry).toBe(3);
  });

  it("has refetchOnWindowFocus disabled", () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
  });

  it("has retryDelay as a function", () => {
    const defaults = queryClient.getDefaultOptions();
    expect(typeof defaults.queries?.retryDelay).toBe("function");
  });

  it("retryDelay uses exponential backoff", () => {
    const defaults = queryClient.getDefaultOptions();
    const retryDelay = defaults.queries?.retryDelay;

    if (typeof retryDelay === "function") {
      expect(retryDelay(0, new Error())).toBe(1000); // 2^0 * 1000
      expect(retryDelay(1, new Error())).toBe(2000); // 2^1 * 1000
      expect(retryDelay(2, new Error())).toBe(4000); // 2^2 * 1000
      expect(retryDelay(3, new Error())).toBe(8000); // 2^3 * 1000
    }
  });

  it("retryDelay caps at 30 seconds", () => {
    const defaults = queryClient.getDefaultOptions();
    const retryDelay = defaults.queries?.retryDelay;

    if (typeof retryDelay === "function") {
      // 2^6 * 1000 = 64000, should be capped to 30000
      expect(retryDelay(6, new Error())).toBe(30000);
      expect(retryDelay(10, new Error())).toBe(30000);
    }
  });
});

describe("createTestQueryClient", () => {
  it("creates a new QueryClient instance", () => {
    const testClient = createTestQueryClient();
    expect(testClient).toBeDefined();
    expect(testClient).not.toBe(queryClient);
  });

  it("has stale time set to 0 for testing", () => {
    const testClient = createTestQueryClient();
    const defaults = testClient.getDefaultOptions();
    expect(defaults.queries?.staleTime).toBe(0);
  });

  it("has gc time set to 0 for testing", () => {
    const testClient = createTestQueryClient();
    const defaults = testClient.getDefaultOptions();
    expect(defaults.queries?.gcTime).toBe(0);
  });

  it("has retry disabled for testing", () => {
    const testClient = createTestQueryClient();
    const defaults = testClient.getDefaultOptions();
    expect(defaults.queries?.retry).toBe(false);
  });

  it("creates independent instances", () => {
    const client1 = createTestQueryClient();
    const client2 = createTestQueryClient();
    expect(client1).not.toBe(client2);
  });
});
