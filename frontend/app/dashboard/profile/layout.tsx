import type { Metadata } from "next";

export const metadata: Metadata = { title: "Profile | MR.FIT", description: "Manage your user profile and settings" };

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
