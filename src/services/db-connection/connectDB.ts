// src/services/db-connection/index.ts
export async function handleConnectToDB(): Promise<{
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

export const generateConnectionString = (
  dbType: string,
  projectName: string
): string => {
  const connectionStrings: Record<string, string> = {
    postgresql: `postgresql://postgres:Zoza@3902462@localhost:5432/${projectName}?schema=public`,
    mysql: `mysql://root:root@localhost:3306/${projectName}`,
    mongodb: `mongodb://localhost:27017/${projectName}`,
  };

  if (!(dbType in connectionStrings)) {
    throw new Error(
      `Invalid dbType: ${dbType}. Expected one of ${Object.keys(
        connectionStrings
      ).join(", ")}`
    );
  }

  return connectionStrings[dbType];
};
