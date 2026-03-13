import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const result = await pool.query(
      "SELECT security_question FROM users WHERE email = $1",
      [email]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "No account found" }, { status: 404 });
    }

    return NextResponse.json({ question: result.rows[0].security_question });
  } catch (error: any) {
    console.error("Verify security question error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}