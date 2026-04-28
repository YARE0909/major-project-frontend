import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

const SALT_ROUNDS = 10;

async function hashPassword(plain: string) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function signupService(email: string, password: string) {
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    throw new Error("Email already in use");
  }

  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
    },
  });

  return user;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password required" },
        { status: 400 }
      );
    }

    const user = await signupService(email, password);

    return NextResponse.json({
      id: user.id,
      email: user.email,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Signup failed" },
      { status: 400 }
    );
  }
}