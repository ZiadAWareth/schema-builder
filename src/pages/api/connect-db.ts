// src/services/db-connection/index.ts
export async function pushConnectionCommand(): Promise<{
  stdout?: string;
  stderr?: string;
  error?: string;
}> {
  try {
    const response = await fetch("/api/db-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        /* any data if needed */
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.error || "Unknown error" };
    }
    return await response.json();
  } catch (error) {
    console.error("Error pushing connection command:", error);
    return { error: "Internal Error" };
  }
}
