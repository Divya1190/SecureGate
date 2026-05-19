import Link from "next/link";

export default function Home() {
  return (
    <div style={container}>
      <header style={header}>
        <div style={logo}>SecureGate</div>
        <div style={nav}>
          <Link href="/login" style={navLink}>
            Sign In
          </Link>
          <Link href="/signup" style={btnNav}>
            Register
          </Link>
        </div>
      </header>

      <main style={mainContent}>
        <div style={heroSection}>
          <div style={badge}>Identity & Access Management</div>
          <h1 style={title}>
            Secure by Default. <br />
            <span style={highlight}>Production Ready.</span>
          </h1>
          <p style={description}>
            A robust, standard-compliant authentication system built with Next.js 14,
            NextAuth, Prisma ORM, and PostgreSQL. Engineered with cryptographically
            random tokens, sliding-window rate limiting, 12-salt bcrypt hashing, and React Email.
          </p>

          <div style={actions}>
            <Link href="/dashboard" style={btnPrimary}>
              Go to Dashboard
            </Link>
            <Link href="/signup" style={btnSecondary}>
              Create Free Account
            </Link>
          </div>
        </div>

        <div style={featuresGrid}>
          <div style={featureCard}>
            <div style={icon}>🔒</div>
            <h3 style={featureTitle}>12-Salt Hashing</h3>
            <p style={featureDesc}>
              Passwords are automatically protected using bcrypt with 12 adaptive salt
              rounds (Rule S1) preventing offline cracking.
            </p>
          </div>

          <div style={featureCard}>
            <div style={icon}>🛡️</div>
            <h3 style={featureTitle}>Rate Limited</h3>
            <p style={featureDesc}>
              Sliding-window IP rate limiting protects forgot password, signup, and login from brute-force (Rule S5).
            </p>
          </div>

          <div style={featureCard}>
            <div style={icon}>📧</div>
            <h3 style={featureTitle}>React Email</h3>
            <p style={featureDesc}>
              Transactional verification and reset templates sent natively using Resend client integrations (Rule A7).
            </p>
          </div>
        </div>
      </main>

      <footer style={footer}>
        <p style={footerText}>
          SecureGate • Designed and Engineered for Enterprise-Grade Security
        </p>
      </footer>
    </div>
  );
}

const container = {
  minHeight: "100vh",
  backgroundColor: "#0b0f19",
  color: "#e2e8f0",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "space-between",
  backgroundImage: "radial-gradient(circle at 50% -20%, #1e1b4b 0%, #0b0f19 80%)",
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "24px 40px",
  maxWidth: "1200px",
  margin: "0 auto",
  width: "100%",
};

const logo = {
  fontSize: "24px",
  fontWeight: "800",
  color: "#6366f1",
  letterSpacing: "-0.5px",
};

const nav = {
  display: "flex",
  alignItems: "center",
  gap: "24px",
};

const navLink = {
  color: "#94a3b8",
  textDecoration: "none",
  fontWeight: "500",
  fontSize: "15px",
  transition: "color 0.2s",
};

const btnNav = {
  backgroundColor: "#6366f1",
  color: "#fff",
  textDecoration: "none",
  fontWeight: "600",
  fontSize: "14px",
  padding: "8px 16px",
  borderRadius: "8px",
  transition: "opacity 0.2s",
};

const mainContent = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "80px 40px",
  width: "100%",
  display: "flex",
  flexDirection: "column" as const,
  gap: "100px",
};

const heroSection = {
  textAlign: "center" as const,
  maxWidth: "800px",
  margin: "0 auto",
};

const badge = {
  display: "inline-block",
  backgroundColor: "rgba(99, 102, 241, 0.15)",
  color: "#818cf8",
  fontSize: "13px",
  fontWeight: "600",
  padding: "6px 14px",
  borderRadius: "20px",
  marginBottom: "24px",
  border: "1px solid rgba(99, 102, 241, 0.3)",
};

const title = {
  fontSize: "56px",
  fontWeight: "800",
  lineHeight: "1.1",
  letterSpacing: "-1.5px",
  color: "#ffffff",
  marginBottom: "24px",
};

const highlight = {
  background: "linear-gradient(to right, #818cf8, #c084fc)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

const description = {
  fontSize: "18px",
  lineHeight: "1.6",
  color: "#94a3b8",
  marginBottom: "40px",
};

const actions = {
  display: "flex",
  justifyContent: "center",
  gap: "16px",
};

const btnPrimary = {
  backgroundColor: "#6366f1",
  color: "#fff",
  textDecoration: "none",
  fontWeight: "600",
  fontSize: "16px",
  padding: "14px 28px",
  borderRadius: "8px",
  boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
};

const btnSecondary = {
  backgroundColor: "#1e293b",
  color: "#e2e8f0",
  textDecoration: "none",
  fontWeight: "600",
  fontSize: "16px",
  padding: "14px 28px",
  borderRadius: "8px",
  border: "1px solid #334155",
};

const featuresGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "32px",
};

const featureCard = {
  backgroundColor: "rgba(30, 41, 59, 0.4)",
  border: "1px solid #1e293b",
  borderRadius: "16px",
  padding: "32px",
  backdropFilter: "blur(12px)",
};

const icon = {
  fontSize: "32px",
  marginBottom: "16px",
};

const featureTitle = {
  fontSize: "20px",
  fontWeight: "700",
  color: "#ffffff",
  marginBottom: "12px",
};

const featureDesc = {
  fontSize: "15px",
  lineHeight: "1.5",
  color: "#94a3b8",
};

const footer = {
  borderTop: "1px solid #1e293b",
  padding: "32px 40px",
  textAlign: "center" as const,
};

const footerText = {
  fontSize: "14px",
  color: "#64748b",
};
