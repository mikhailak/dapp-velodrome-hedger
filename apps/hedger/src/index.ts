export async function ping() {
    return { hedger: "ready" };
  }
  
  if (import.meta.url === `file://${process.argv[1]}`) {
    ping().then(console.log).catch(console.error);
  }
  