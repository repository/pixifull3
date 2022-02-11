import fetch, { RequestInfo, RequestInit, Response } from "node-fetch";

export const chunkArray = <T>(a: T[], size: number): T[][] =>
  Array.from(new Array(Math.ceil(a.length / size)), (_, i) => a.slice(i * size, i * size + size));

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const indent = (str: any, indent: string = "  ") => String(str).replace(/^/gm, indent);

export class FetchRetryError extends Error {
  constructor(public readonly errors: Error[]) {
    super();
  }

  public toString() {
    return this.errors.map((e) => e.toString()).join("\n");
  }
}

export async function fetchRetry(
  url: RequestInfo,
  {
    retries,
    timeout,
    passed,
    errors,
    ...options
  }: RequestInit & {
    retries: number;
    timeout: number;
    passed?: (res: Response) => void;
    errors?: any[];
  },
): Promise<Response> {
  if (retries <= 0) {
    throw new FetchRetryError(errors || []);
  } else if (timeout < 0 || !isFinite(timeout)) {
    throw new Error("Invalid timeout");
  }

  const check =
    passed ||
    ((res) => {
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`);
      }
      return true;
    });

  try {
    const response = await fetch(url, options);
    check(response);
    return response;
  } catch (error) {
    return sleep(timeout).then(() =>
      fetchRetry(url, { retries: retries - 1, timeout, passed, errors: [...(errors || []), error], ...options }),
    );
  }
}
