export interface GraphResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

function getGraphEndpoint(): string {
  const direct = process.env.GRAPH_ENDPOINT;
  if (direct && direct.startsWith("http")) return direct;

  const apiKey = process.env.GRAPH_API_KEY;
  const subgraphId = process.env.GRAPH_SUBGRAPH_ID;
  if (!apiKey || !subgraphId) {
    throw new Error("GRAPH_API_KEY or GRAPH_SUBGRAPH_ID is not set");
  }
  return `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/${subgraphId}`;
}

export async function graphQuery<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const endpoint = getGraphEndpoint();

  const timeoutMs = Number(process.env.GRAPH_TIMEOUT_MS ?? 10000);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "dapp-velodrome-hedger/1.0",
      },
      body: JSON.stringify({ query, variables }),
      signal: ctrl.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Graph query failed: ${res.status} ${text}`);
    }
    const json = (await res.json()) as GraphResponse<T>;
    if (json.errors?.length) {
      throw new Error(
        "Graph errors: " + json.errors.map((e) => e.message).join("; ")
      );
    }
    if (!json.data) throw new Error("Graph response without data");
    return json.data;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Fetch to The Graph failed at ${endpoint}: ${msg}`);
  } finally {
    clearTimeout(timer);
  }
}
