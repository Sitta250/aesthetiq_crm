import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const LANGUAGES = [
  "EN",
  "TH",
  "ZH",
  "JA",
  "RU",
  "KO",
  "AR",
  "OTHER",
] as const;

const TEMPLATE_CATEGORIES = [
  "welcome",
  "follow_up",
  "deposit_reminder",
  "confirmation",
  "re_engage",
] as const;

const QuerySchema = z.object({
  language: z.enum(LANGUAGES).optional(),
  category: z.enum(TEMPLATE_CATEGORIES).optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const parsed = QuerySchema.safeParse({
    language: searchParams.get("language") ?? undefined,
    category: searchParams.get("category") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { language, category } = parsed.data;

  const templates = await prisma.template.findMany({
    where: {
      ...(language && { language }),
      ...(category && { category }),
    },
    orderBy: [{ language: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(templates);
}
