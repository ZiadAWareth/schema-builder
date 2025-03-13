import { Table } from "@/types/Table";
import { generateConnectionString } from "../db-connection/connectDB";

// Import useState from React if not already imported in the file where this function is defined
// import { useState } from "react";

export const handleGenerateSchema = async (
  dbType: string,
  projectName: string,
  tables: Table[],
  setGenerating: (generating: boolean) => void,
  showToast: (message: string) => void,
  setSchemaModalOpen: (isOpen: boolean) => void,
  setGeneratedSchema: (schema: string) => void
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

    // Set the schema and open the modal
    setGeneratedSchema(schema);
    setSchemaModalOpen(true);
  } catch (error) {
    console.error("Error generating schema:", error);
    showToast("Failed to generate schema");
  } finally {
    setGenerating(false);
  }
};
