import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/ui/AuthShell";
import FormAlert from "../components/ui/FormAlert";
import FormInput from "../components/ui/FormInput";
import PasswordInput from "../components/ui/PasswordInput";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    const result = await login(form);

    setLoading(false);

    if (!result.success) {
      setMessage(result.message);
      return;
    }

    navigate("/dashboard");
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Login to access your protected dashboard."
    >
      <FormAlert message={message} />

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" autoComplete="on">
        <FormInput
          label="Email address"
          type="email"
          name="email"
          value={form.email}
          onChange={updateField}
          placeholder="user@example.com"
          autoComplete="email"
          required
        />

        <PasswordInput
          label="Password"
          name="password"
          value={form.password}
          onChange={updateField}
          placeholder="Enter your password"
          autoComplete="current-password"
          required
        />

        <button className="btn-primary" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        No account?{" "}
        <Link className="font-semibold text-blue-600 hover:text-blue-700" to="/register">
          Create account
        </Link>
      </p>
    </AuthShell>
  );
}