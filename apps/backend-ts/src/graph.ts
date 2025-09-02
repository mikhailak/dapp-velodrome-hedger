// Простой fetch-клиент для The Graph (GraphQL)
export interface GraphResponse<T> {
    data?: T;
    errors?: Array<{ message: string }>;
  }
  
  function getGraphEndpoint() {
    const apiKey = process.env.GRAPH_API_KEY;
    const subgraphId = process.env.GRAPH_SUBGRAPH_ID;
  
    // Рекомендуемый формат эндпойнта на The Graph Network:
    // https://gateway.thegraph.com/api/<API_KEY>/subgraphs/id/<SUBGRAPH_ID>
    // (точный URL всегда берём из Explorer -> Query)
    if (!apiKey || !subgraphId) {
      throw new Error("GRAPH_API_KEY or GRAPH_SUBGRAPH_ID is not set");
    }
    return `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/${subgraphId}`;
  }
  
  export async function graphQuery<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const res = await fetch(getGraphEndpoint(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Graph query failed: ${res.status} ${text}`);
    }
    const json = (await res.json()) as GraphResponse<T>;
    if (json.errors?.length) {
      throw new Error("Graph errors: " + json.errors.map((e) => e.message).join("; "));
    }
    if (!json.data) {
      throw new Error("Graph response without data");
    }
    return json.data;
  }
  