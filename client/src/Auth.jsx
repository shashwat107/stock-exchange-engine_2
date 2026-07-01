import { useState } from "react";
import { supabase } from "./supabaseClient";
 
const styles = {
  overlay: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0f0f0f",
    fontFamily: "'Georgia', serif",
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    background: "#1a1a1a",
    border: "1px solid #2e2e2e",
    borderRadius: "4px",
    padding: "48px 40px",
  },
  wordmark: {
    fontSize: "11px",
    fontFamily: "'Courier New', monospace",
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: "#555",
    marginBottom: "32px",
  },
  heading: {
    fontSize: "26px",
    fontWeight: "400",
    color: "#e8e0d5",
    margin: "0 0 6px 0",
    lineHeight: 1.2,
  },
  subheading: {
    fontSize: "13px",
    color: "#555",
    margin: "0 0 36px 0",
    fontFamily: "'Courier New', monospace",
  },
  fieldGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontSize: "11px",
    fontFamily: "'Courier New', monospace",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: "#666",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    background: "#111",
    border: "1px solid #2e2e2e",
    borderRadius: "3px",
    padding: "12px 14px",
    fontSize: "14px",
    color: "#e8e0d5",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
    fontFamily: "'Georgia', serif",
  },
  inputFocus: {
    borderColor: "#c8a96e",
  },
  errorBox: {
    background: "#1f1010",
    border: "1px solid #5a2020",
    borderRadius: "3px",
    padding: "10px 14px",
    marginBottom: "20px",
    fontSize: "12px",
    fontFamily: "'Courier New', monospace",
    color: "#c06060",
    lineHeight: 1.5,
  },
  buttonRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginTop: "28px",
  },
  btnPrimary: {
    padding: "13px",
    background: "#c8a96e",
    border: "none",
    borderRadius: "3px",
    fontSize: "11px",
    fontFamily: "'Courier New', monospace",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "#0f0f0f",
    cursor: "pointer",
    fontWeight: "700",
    transition: "background 0.15s, opacity 0.15s",
  },
  btnSecondary: {
    padding: "13px",
    background: "transparent",
    border: "1px solid #2e2e2e",
    borderRadius: "3px",
    fontSize: "11px",
    fontFamily: "'Courier New', monospace",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "#888",
    cursor: "pointer",
    transition: "border-color 0.15s, color 0.15s",
  },
  btnDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
  },
  divider: {
    height: "1px",
    background: "#2e2e2e",
    margin: "28px 0",
  },
  footer: {
    fontSize: "11px",
    fontFamily: "'Courier New', monospace",
    color: "#3a3a3a",
    textAlign: "center",
    letterSpacing: "0.05em",
  },
};
 
export default function Auth({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
 
  const clearError = () => setError("");
 
  const handleLogin = async () => {
    if (!email || !password) {
      setError("Both fields are required.");
      return;
    }
 
    setLoading(true);
    clearError();
 
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
 
    setLoading(false);
 
    if (signInError) {
      setError(signInError.message);
      return;
    }
 
    onLogin?.(data.user);
  };
 
  const handleSignUp = async () => {
    if (!email || !password) {
      setError("Both fields are required.");
      return;
    }
 
    setLoading(true);
    clearError();
 
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
 
    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }
 
    // Immediately create portfolio row for the new user.
    // wallet_balance_cents defaults to 1,000,000 in the database.
    const { error: insertError } = await supabase
      .from("portfolios")
      .insert([{ user_email: email }]);
 
    setLoading(false);
 
    if (insertError) {
      setError(`Account created, but portfolio setup failed: ${insertError.message}`);
      return;
    }
 
    onLogin?.(data.user);
  };
 
  const inputStyle = (field) => ({
    ...styles.input,
    ...(focusedField === field ? styles.inputFocus : {}),
  });
 
  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.wordmark}>Portfolio ∙ App</div>
 
        <h1 style={styles.heading}>Welcome back.</h1>
        <p style={styles.subheading}>Sign in or create an account to continue.</p>
 
        {error && <div style={styles.errorBox}>{error}</div>}
 
        <div style={styles.fieldGroup}>
          <label style={styles.label} htmlFor="auth-email">
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
            style={inputStyle("email")}
            disabled={loading}
          />
        </div>
 
        <div style={styles.fieldGroup}>
          <label style={styles.label} htmlFor="auth-password">
            Password
          </label>
          <input
            id="auth-password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setFocusedField("password")}
            onBlur={() => setFocusedField(null)}
            style={inputStyle("password")}
            disabled={loading}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>
 
        <div style={styles.buttonRow}>
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              ...styles.btnPrimary,
              ...(loading ? styles.btnDisabled : {}),
            }}
          >
            {loading ? "Wait…" : "Log In"}
          </button>
 
          <button
            onClick={handleSignUp}
            disabled={loading}
            style={{
              ...styles.btnSecondary,
              ...(loading ? styles.btnDisabled : {}),
            }}
          >
            Sign Up
          </button>
        </div>
 
        <div style={styles.divider} />
        <div style={styles.footer}>
          New accounts receive $10,000 in virtual funds.
        </div>
      </div>
    </div>
  );
}
 