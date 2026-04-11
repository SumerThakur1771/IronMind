import prisma from "@/app/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const user = await prisma.user.findUnique({
    where: { email: body.email },
  });
  if (!user) {
    return NextResponse.json({ error: "user does not exists" });
  }
  const passwordMatch = await bcrypt.compare(body.password, user.passwordHash);
  if (!passwordMatch) {
    return NextResponse.json({ error: "wrong password" });
  } else {
    const token = jwt.sign(
      { userId: user.id, email: body.email, role: user.role },
      process.env.JWT_SECRET!,
    );
    return NextResponse.json(token);
  }
}
