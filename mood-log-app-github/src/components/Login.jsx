import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin,
        shouldCreateUser: true,
      },
    });
    setSending(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F7F5F2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "380px",
          background: "#FFFFFF",
          border: "1px solid #E5E1D8",
          borderRadius: "16px",
          padding: "36px 32px",
          boxShadow: "0 1px 3px rgba(43,42,51,0.05)",
        }}
      >
        <h1
          style={{
            fontFamily: "Georgia, 'Source Serif 4', serif",
            fontSize: "26px",
            fontWeight: 500,
            margin: "0 0 6px",
            color: "#2B2A33",
          }}
        >
          Mood Log
        </h1>
        <p style={{ margin: "0 0 28px", fontSize: "14px", color: "#8B8579" }}>
          Sign in with your email — no password needed.
        </p>

        {sent ? (
          <div
            style={{
              background: "#F0F6EC",
              border: "1px solid #CFE3C0",
              borderRadius: "10px",
              padding: "16px",
              fontSize: "14px",
              color: "#4B6B3A",
              lineHeight: 1.5,
            }}
          >
            Check <strong>{email}</strong> for a sign-in link. It expires in
            about an hour and can only be used once.
            <button
              onClick={() => setSent(false)}
              style={{
                display: "block",
                marginTop: "12px",
                background: "none",
                border: "none",
                color: "#4B6B3A",
                fontSize: "13px",
                textDecoration: "underline",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: "100%",
                border: "1px solid #E5E1D8",
                borderRadius: "10px",
                padding: "12px 14px",
                fontSize: "14px",
                fontFamily: "inherit",
                color: "#2B2A33",
                background: "#FBFAF8",
                marginBottom: "14px",
                boxSizing: "border-box",
              }}
            />
            <button
              type="submit"
              disabled={sending || !email}
              style={{
                width: "100%",
                background: "#8B7FD1",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "10px",
                padding: "12px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: sending ? "default" : "pointer",
                opacity: sending || !email ? 0.6 : 1,
              }}
            >
              {sending ? "Sending…" : "Send sign-in link"}
            </button>
            {error && (
              <p style={{ color: "#E0735F", fontSize: "13px", marginTop: "12px" }}>
                {error}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
