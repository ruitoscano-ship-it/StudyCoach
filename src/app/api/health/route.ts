import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readAppEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    readAppEnv();
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      {
        status: "ok",
        checks: {
          env: "ok",
          database: "ok",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "degraded",
        checks: {
          env: "failed",
          database: "failed",
        },
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
