import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { email, password, securityQuestion, securityAnswer } = await req.json();

        if (!email || !password || !securityQuestion || !securityAnswer) {
            return NextResponse.json(
                { error: "Email, password, security question, and security answer are required" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        const hashed = await bcrypt.hash(password, 12);
        const securityAnswerHash = await bcrypt.hash(securityAnswer.toLowerCase().trim(), 12);

        const res = await pool.query(
            "INSERT INTO users (email, password_hash, security_question, security_answer_hash) VALUES ($1, $2, $3, $4) RETURNING id, email",
            [email, hashed, securityQuestion, securityAnswerHash]
        );

        const user = res.rows[0];

        // Create empty profile row so the profile page doesn't fail
        await pool.query("INSERT INTO profiles (user_id) VALUES ($1)", [user.id]);

        return NextResponse.json({
            success: true,
            user: { id: user.id, email: user.email },
        });
    } catch (err: any) {
        // Unique violation = duplicate email
        if (err.code === "23505") {
            return NextResponse.json(
                { error: "Email already registered" },
                { status: 409 }
            );
        }
        console.error("Register error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
