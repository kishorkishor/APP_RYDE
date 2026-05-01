import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../context/AuthContext";
import { BrandMark } from "../components/BrandMark";
import { checkApiHealth } from "../services/api";

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@ryde.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [health, setHealth] = useState<"checking" | "online" | "offline">("checking");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkApiHealth()
      .then(() => setHealth("online"))
      .catch(() => setHealth("offline"));
  }, []);

  const handleLogin = async (event: React.FormEvent, destination = "/dashboard") => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
      navigate(destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f4ed] dark:bg-[#11110f] flex items-center justify-center p-4">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(215,179,95,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.75),transparent)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(215,179,95,0.18),transparent_34%)]" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandMark size="lg" />
          <p className="mt-4 max-w-xs text-sm text-gray-500 dark:text-gray-400">
            Operations control for executive ride dispatch.
          </p>
        </div>

        <div className="bg-white/95 dark:bg-[#171715] border border-[#ded3b8] dark:border-[#3a3120] rounded-2xl p-6 shadow-[0_24px_80px_rgba(23,23,21,0.12)] backdrop-blur">
          <h2 className="text-xl mb-1 text-gray-900 dark:text-gray-100">Admin Login</h2>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Use your RYDE operations credentials.</p>
          <div className={`mb-4 rounded-lg border px-3 py-2 text-xs ${
            health === "online"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : health === "offline"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-[#e7dfcd] bg-[#f8f6f1] text-gray-600"
          }`}>
            {health === "online" && "Admin API connected."}
            {health === "offline" && "Admin API is not reachable. Start backend: E:\\app 2\\backend > npm run dev"}
            {health === "checking" && "Checking admin API..."}
          </div>

          <form onSubmit={(event) => handleLogin(event)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@ryde.local"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5"
              />
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" disabled={submitting || health === "offline"} className="w-full bg-[#171715] text-[#f5dd95] hover:bg-[#27231a] disabled:opacity-60">
              {submitting ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </div>

        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">Authorized personnel only</p>
          <div className="flex gap-2 justify-center text-xs">
            <button
              onClick={(event) => handleLogin(event, "/dashboard")}
              className="text-blue-600 hover:underline"
            >
              Desktop View
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={(event) => handleLogin(event, "/mobile")}
              className="text-blue-600 hover:underline"
            >
              Mobile View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
