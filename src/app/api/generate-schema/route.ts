import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const prismaSchema = generatePrismaSchema(data);
    console.log("DATA:", prismaSchema);
    // console.log("DATA:", data);
    return new NextResponse(prismaSchema, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": 'attachment; filename="schema.prisma"',
      },
    });
  } catch (error) {
    console.error("Error generating schema:", error);
    return NextResponse.json(
      { error: "Failed to generate schema" },
      { status: 500 }
    );
  }
}

function generatePrismaSchema(schemaData: any) {
  // Create the header section
  // console.log("SCHEMA DATA", schemaData);
  let output = `
datasource db {
  provider = "${schemaData.dbType || "postgresql"}"
  url      = "${schemaData.databaseUrl}"
}

generator client {
  provider = "prisma-client-js"
}\n\n`;

  // Keep track of model names to avoid duplicates
  const usedModelNames = new Set<string>();

  // Generate model definitions
  if (schemaData.tables && Array.isArray(schemaData.tables)) {
    schemaData.tables.forEach((table: any) => {
      // Skip tables without a name
      if (!table.name) return;

      // Format model name (remove spaces and special chars, ensure valid Pascal case)
      let modelName = formatModelName(table.name);

      // Handle duplicate model names
      let uniqueModelName = modelName;
      let counter = 1;
      while (usedModelNames.has(uniqueModelName.toLowerCase())) {
        uniqueModelName = `${modelName}${counter}`;
        counter++;
      }
      usedModelNames.add(uniqueModelName.toLowerCase());

      // Start model definition
      output += `model ${uniqueModelName} {\n`;

      // Add fields
      if (table.fields && Array.isArray(table.fields)) {
        table.fields.forEach((field: any) => {
          if (!field.name) return;

          // Map field type to Prisma type
          const prismaType = mapToPrismaType(field.type);

          // Collect field modifiers
          const modifiers = [];

          // Add required modifier (or make optional with ?)
          const isRequired = field.isRequired !== false; // Default to true if not specified
          const requiredModifier = isRequired ? "" : "?";

          // Add primary key modifier
          if (field.isPrimary) {
            modifiers.push("@id");
          }

          // Add unique modifier
          if (field.isUnique) {
            modifiers.push("@unique");
          }

          // Add special default values
          if (field.name === "id" && field.isPrimary) {
            modifiers.push("@default(autoincrement())");
          } else if (field.name === "createdAt") {
            modifiers.push("@default(now())");
          }

          // Combine modifiers
          const modifierString =
            modifiers.length > 0 ? " " + modifiers.join(" ") : "";

          // Add the field to the model
          output += `  ${field.name} ${prismaType}${requiredModifier}${modifierString}\n`;
        });
      }

      // Close model definition
      output += `}\n\n`;
    });
  }

  return output;
}

// Helper to format model names to be valid Prisma identifiers
function formatModelName(name: string): string {
  // Replace spaces and special characters with nothing
  let formatted = name.replace(/[^\w]/g, "");

  // Ensure it starts with a letter
  if (!/^[A-Za-z]/.test(formatted)) {
    formatted = "Model" + formatted;
  }

  // Convert to PascalCase (capitalize first letter)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

// Helper to map our field types to Prisma types
function mapToPrismaType(type: string): string {
  switch (type?.toLowerCase()) {
    case "string":
      return "String";
    case "int":
      return "Int";
    case "boolean":
      return "Boolean";
    case "float":
      return "Float";
    case "datetime":
      return "DateTime";
    case "email":
      return "String"; // Email is just a string in Prisma
    case "text":
      return "String"; // Text is also a string in Prisma
    case "enum":
      return "String"; // For simplicity, we're treating enums as strings
    default:
      return "String"; // Default to String for unknown types
  }
}
