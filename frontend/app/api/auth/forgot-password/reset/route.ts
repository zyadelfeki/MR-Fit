import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, answer, newPassword } = await req.json();

    if (!email || !answer || !newPassword) {
      return NextResponse.json(
        { error: "Email, answer, and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      "SELECT security_answer_hash FROM users WHERE email = $1",
      [email]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "No account found" }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(
      answer.toLowerCase().trim(),
      result.rows[0].security_answer_hash
    );

    if (!isMatch) {
      return NextResponse.json({ error: "Incorrect answer" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      "UPDATE users SET password_hash = $1 WHERE email = $2",
      [passwordHash, email]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Forgot password reset error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}