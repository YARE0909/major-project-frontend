import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

async function comparePassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

function signJwt(payload: object, expiresIn: string = "7d") {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn,
  });
}

async function loginService(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const ok = await comparePassword(password, user.password);

  if (!ok) {
    throw new Error("Invalid credentials");
  }

  const token = signJwt({
    userId: user.id,
  });

  return { token, user };
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

    const { token, user } = await loginService(email, password);

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Login failed" },
      { status: 400 }
    );
  }
}