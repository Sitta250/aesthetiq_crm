import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const staff = await prisma.staff.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      avatarInitials: true,
      role: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(staff);
}
