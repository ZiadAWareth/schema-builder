// src/api/db-connection/route.ts
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

export async function POST(request: Request) {
  try {
    // Optionally parse some input from request
    const execAsync = promisify(exec);
    // Run your command here (child_process is safe to use on the server)
    const { stdout, stderr } = await execAsync("echo 'Connecting to DB'");
    // Return the output (or your connection logic result)
    return NextResponse.json({ stdout, stderr });
  } catch (error) {
    console.error("Error in DB connection API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
