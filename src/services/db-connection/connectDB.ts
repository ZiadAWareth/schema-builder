export const handleConnectToDB = async (
  dbType: string,
  projectName: string,
  prismaSchema: string
) => {
  try {
    const response = await fetch("/api/db-connection", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dbType, projectName, prismaSchema }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Failed to connect to DB:", error);
    return false;
  }
};

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
