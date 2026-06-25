import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmNotice, setConfirmNotice] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      setSubmitting(false);
      if (error) {
        setError(error.message);
        return;
      }
      // If your Supabase project has "Confirm email" turned on, there's no
      // session yet until the user verifies — let them know instead of
      // silently doing nothing.
      if (data.user && !data.session) {
        setConfirmNotice(true);
      }
      // If "Confirm email" is off, data.session is already set and the
      // onAuthStateChange listener in App.jsx will pick it up automatically.
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setSubmitting(false);
      if (error) setError(error.message);
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
        <p style={{ margin: "0 0 24px", fontSize: "14px", color: "#8B8579" }}>
          {mode === "signin" ? "Sign in to your account." : "Create an account."}
        </p>

        {confirmNotice ? (
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
            Account created. This project currently requires confirming your
            email before signing in — check <strong>{email}</strong> for a
            confirmation link.
            <button
              onClick={() => {
                setConfirmNotice(false);
                setMode("signin");
              }}
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
              Back to sign in
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
                marginBottom: "10px",
                boxSizing: "border-box",
              }}
            />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "Create a password (6+ characters)" : "Password"}
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
              disabled={submitting || !email || !password}
              style={{
                width: "100%",
                background: "#8B7FD1",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "10px",
                padding: "12px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: submitting ? "default" : "pointer",
                opacity: submitting || !email || !password ? 0.6 : 1,
              }}
            >
              {submitting
                ? mode === "signup"
                  ? "Creating account…"
                  : "Signing in…"
                : mode === "signup"
                ? "Create account"
                : "Sign in"}
            </button>
            {error && (
              <p style={{ color: "#E0735F", fontSize: "13px", marginTop: "12px" }}>{error}</p>
            )}

            <p style={{ marginTop: "20px", fontSize: "13px", color: "#8B8579", textAlign: "center" }}>
              {mode === "signin" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setError(null);
                    }}
                    style={{ background: "none", border: "none", color: "#8B7FD1", fontWeight: 600, cursor: "pointer", padding: 0, fontSize: "13px" }}
                  >
                    Create one
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setError(null);
                    }}
                    style={{ background: "none", border: "none", color: "#8B7FD1", fontWeight: 600, cursor: "pointer", padding: 0, fontSize: "13px" }}
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
