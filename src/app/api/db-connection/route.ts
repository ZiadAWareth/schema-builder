import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import { generateConnectionString } from "@/services/db-connection/connectDB";
import { randomUUID } from "crypto";
import { writeFileSync } from "fs";

export async function POST(req: Request) {
  const tempSchemaPath = `./prisma/temp-schema-${randomUUID()}.prisma`;

  // try {
  //   const { dbType, projectName, prismaSchema } = await req.json();
  //   const connectionString = generateConnectionString(dbType, projectName);

  //   // 1. Create temporary schema file
  //   const fullSchema = `${prismaSchema}\n\n${getDataSourceBlock(dbType, connectionString)}`;
  //   writeFileSync(tempSchemaPath, fullSchema);
  try {
    const { dbType, projectName, prismaSchema } = await req.json();

    // Generate connection string based on database type and project name
    const connectionString = generateConnectionString(dbType, projectName);
    console.log("Generated Connection String:", connectionString);
    console.log("Prisma Schema:", prismaSchema);
    // const fullSchema = `${prismaSchema}\n\n${getDataSourceBlock(
    //   dbType,
    //   connectionString
    // )}`;
    writeFileSync(tempSchemaPath, prismaSchema);
    // Push schema to database using the schema directly
    try {
      execSync(
        `echo "${prismaSchema}" | npx prisma db push --schema /dev/stdin`,
        {
          stdio: "inherit",
          env: { ...process.env, DATABASE_URL: connectionString },
        }
      );
      console.log("Schema pushed to database successfully.");
    } catch (pushError) {
      console.error("Failed to push schema to database:", pushError);
      return NextResponse.json(
        { success: false, error: "Failed to push schema to database" },
        { status: 500 }
      );
    }

    // Test connection
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: connectionString,
        },
      },
    });
    await prisma.$connect();
    console.log("Connected to the database successfully.");
    await prisma.$disconnect();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Connection failed:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
