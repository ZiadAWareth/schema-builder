import { Table } from "@/types/Table";
import { generateConnectionString } from "../db-connection/connectDB";
export const handleGenerateSchema = async (
  dbType: string,
  projectName: string,
  tables: Table[],
  setGenerating: (generating: boolean) => void,
  showToast: (message: string) => void
) => {
  setGenerating(true);
  const databaseUrl = generateConnectionString(dbType, projectName);
  console.log("databaseUrl", databaseUrl);
  try {
    const response = await fetch("/api/generate-schema", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dbType, databaseUrl, tables }),
    });

    const schema = await response.text();
    localStorage.setItem("prismaSchema", schema);

    // Display the schema in a popup
    // console.log("schema", schema);
    alert(`Generated Prisma Schema:\n\n${schema}`);
  } catch (error) {
    console.error("Error generating schema:", error);
    showToast("Failed to generate schema");
  } finally {
    setGenerating(false);
  }
};
