/**
 * Body-limit tests for parseBody().
 *
 * These tests call parseBody() directly via a synthetic Web API Request —
 * no Next.js server or database is required.
 */
import { describe, it, expect } from "vitest";
import { parseBody, BODY_LIMIT_BYTES } from "../src/lib/schemas";
import { z } from "zod/v4";

const anySchema = z.object({ x: z.string() }).passthrough();

function makeRequest(byteLength: number): Request {
  const base = `{"x":"`;
  const close = `"}`;
  const padLength = byteLength - base.length - close.length;
  const body =
    padLength >= 0
      ? base + "a".repeat(padLength) + close
      : `{"x":""}`.slice(0, byteLength);

  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

function makeRequestWithContentLength(
  bodyBytes: number,
  declaredLength: number,
): Request {
  const body = "a".repeat(bodyBytes);
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": String(declaredLength),
    },
    body,
  });
}

describe("parseBody — body size guard", () => {
  it("passes through a body below the limit", async () => {
    const request = makeRequest(BODY_LIMIT_BYTES - 1);
    const result = await parseBody(request, anySchema);

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
  });

  it("passes through a body exactly at the limit", async () => {
    const request = makeRequest(BODY_LIMIT_BYTES);
    const result = await parseBody(request, anySchema);

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
  });

  it("rejects a body one byte over the limit with 413", async () => {
    const request = makeRequest(BODY_LIMIT_BYTES + 1);
    const result = await parseBody(request, anySchema);

    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();
    expect(result.error!.status).toBe(413);
  });

  it("does not echo body contents in the 413 response", async () => {
    const request = makeRequest(BODY_LIMIT_BYTES + 1024);
    const result = await parseBody(request, anySchema);

    expect(result.error!.status).toBe(413);
    const body = await result.error!.json();
    expect(body).toEqual({ error: "Payload Too Large" });
    expect(Object.keys(body)).toHaveLength(1);
  });

  it("rejects via Content-Length fast path before reading the stream", async () => {
    const request = makeRequestWithContentLength(0, BODY_LIMIT_BYTES + 1);
    const result = await parseBody(request, anySchema);

    expect(result.error).toBeDefined();
    expect(result.error!.status).toBe(413);
  });

  it("rejects when the declared content-length is below the limit but the actual body exceeds it", async () => {
    const request = makeRequestWithContentLength(
      BODY_LIMIT_BYTES + 1,
      BODY_LIMIT_BYTES - 1,
    );
    const result = await parseBody(request, anySchema);

    expect(result.error).toBeDefined();
    expect(result.error!.status).toBe(413);
  });

  it("returns 413 for a very large body (10× limit)", async () => {
    const request = makeRequest(BODY_LIMIT_BYTES * 10);
    const result = await parseBody(request, anySchema);

    expect(result.error!.status).toBe(413);
  });
});

describe("parseBody — existing behaviour preserved (valid-size requests)", () => {
  it("returns 400 for invalid JSON within the limit", async () => {
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const result = await parseBody(request, anySchema);

    expect(result.error).toBeDefined();
    expect(result.error!.status).toBe(400);
    const body = await result.error!.json();
    expect(body.code).toBe("INVALID_JSON");
    expect(body).toHaveProperty("requestId");
    expect(body).not.toHaveProperty("error");
  });

  it("returns 400 for a valid-size body that fails schema validation", async () => {
    const strictSchema = z.object({ requiredField: z.string() });
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wrongField: 123 }),
    });
    const result = await parseBody(request, strictSchema);

    expect(result.error).toBeDefined();
    expect(result.error!.status).toBe(400);
    const body = await result.error!.json();
    expect(body.code).toBe("VALIDATION_ERROR");
    expect(Array.isArray(body.issues)).toBe(true);
    expect(body).toHaveProperty("requestId");
  });
});
