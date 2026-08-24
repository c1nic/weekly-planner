"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabaseRef = useRef(null);
  if (!supabaseRef.current) {
    supabaseRef.current = createClient();
  }
  const supabase = supabaseRef.current;
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }
      window.location.href = "/";
      return;
    }

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Account created. You can sign in now.");
    setMode("signin");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <h1
          className="text-3xl font-bold mb-2 text-center"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Weekly Planner
        </h1>
        <p
          className="text-sm text-gray-500 text-center mb-8 font-mono"
          style={{ fontFamily: "var(--font-dm-mono)" }}
        >
          Sign in to access your planner
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-sm font-mono text-gray-600 mb-1"
              style={{ fontFamily: "var(--font-dm-mono)" }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-black focus:outline-none"
              autoComplete="email"
            />
          </div>

          <div>
            <label
              className="block text-sm font-mono text-gray-600 mb-1"
              style={{ fontFamily: "var(--font-dm-mono)" }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-black focus:outline-none"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />
          </div>

          {message && (
            <p className="text-sm text-red-600 font-mono" style={{ fontFamily: "var(--font-dm-mono)" }}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-black text-white rounded-md font-mono hover:bg-gray-800 transition-colors disabled:opacity-50"
            style={{ fontFamily: "var(--font-dm-mono)" }}
          >
            {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setMessage("");
          }}
          className="w-full mt-4 text-sm text-gray-500 hover:text-black font-mono"
          style={{ fontFamily: "var(--font-dm-mono)" }}
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
