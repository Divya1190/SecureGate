import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.emailVerified) {
    redirect("/verify-email-prompt");
  }

  return (
    <div className="dashboard">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <div className="avatar">{session.user.name?.[0]?.toUpperCase() ?? session.user.email[0].toUpperCase()}</div>
          <div>
            <h1>Welcome back{session.user.name ? `, ${session.user.name}` : ""}!</h1>
            <p className="subtitle">You are securely authenticated.</p>
          </div>
        </div>

        <div className="dashboard-info">
          <div className="info-row">
            <span className="info-label">Email</span>
            <span className="info-value">{session.user.email}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Status</span>
            <span className="badge-verified">✓ Verified</span>
          </div>
          <div className="info-row">
            <span className="info-label">Name</span>
            <span className="info-value">{session.user.name ?? "—"}</span>
          </div>
        </div>

        <SignOutButton />
      </div>
    </div>
  );
}
