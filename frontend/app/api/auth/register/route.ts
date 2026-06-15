import { NextResponse } from "next/server";
import { withDb } from "@/lib/db";
import bcrypt from "bcryptjs";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const { email, password, securityQuestion, securityAnswer } = await req.json();
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedEmail || !password || !securityQuestion || !securityAnswer) {
      return NextResponse.json(
        { error: "Email, password, security question, and security answer are required" },
        { status: 400 }
      );
    }

    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const securityAnswerHash = await bcrypt.hash(securityAnswer.toLowerCase().trim(), 12);

    const result = await withDb(async (client) => {
      await client.query("BEGIN");
      try {
        const res = await client.query(
          `INSERT INTO users (email, password_hash, security_question, security_answer_hash)
           VALUES ($1, $2, $3, $4)
           RETURNING id, email`,
          [normalizedEmail, hashed, securityQuestion, securityAnswerHash]
        );
        const user = res.rows[0];
        await client.query(
          `INSERT INTO profiles (user_id)
           VALUES ($1)
           ON CONFLICT (user_id) DO NOTHING`,
          [user.id]
        );
        await client.query("COMMIT");
        return user;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    });

    return NextResponse.json(
      { success: true, user: { id: result.id, email: result.email } },
      { status: 201 }
    );
  } catch (err: any) {
    if (err.code === "23505") {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
    console.error("Register error:", err);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
