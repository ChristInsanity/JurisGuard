import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await register({
        full_name: fullName,
        email,
        password,
      });
      setSuccess(response.message);
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB] px-4 py-10">
      <div className="w-full max-w-lg rounded-lg border border-[#E5E7EB] bg-white p-8 shadow-sm shadow-[#111827]/5">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#2F80ED]">
            JurisGuard
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[#111827]">Create Account</h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            New accounts use the backend registration endpoint and do not auto-login.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-[#111827]">Full Name</span>
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm text-[#111827] outline-none transition focus:border-[#2F80ED] focus:ring-2 focus:ring-[#2F80ED]/15"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              autoComplete="name"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[#111827]">Email</span>
            <input
              type="email"
              className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm text-[#111827] outline-none transition focus:border-[#2F80ED] focus:ring-2 focus:ring-[#2F80ED]/15"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-[#111827]">Password</span>
              <input
                type="password"
                className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm text-[#111827] outline-none transition focus:border-[#2F80ED] focus:ring-2 focus:ring-[#2F80ED]/15"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#111827]">Confirm Password</span>
              <input
                type="password"
                className="mt-1 w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm text-[#111827] outline-none transition focus:border-[#2F80ED] focus:ring-2 focus:ring-[#2F80ED]/15"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-[#2F80ED] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1f6fd6] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Submitting..." : "Register"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#6B7280]">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-[#2F80ED] hover:text-[#1f6fd6]">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
