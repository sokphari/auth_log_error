import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/ui/AuthShell";
import FormAlert from "../components/ui/FormAlert";
import FormInput from "../components/ui/FormInput";
import PasswordInput from "../components/ui/PasswordInput";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
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

    if (form.password !== form.password_confirmation) {
      setMessage("Password confirmation does not match.");
      return;
    }

    setLoading(true);

    const result = await register(form);

    setLoading(false);

    if (!result.success) {
      setMessage(result.message);
      return;
    }

    navigate("/dashboard");
  }

  return (
    <AuthShell
      title="Create account"
      subtitle="Register and start using the protected dashboard."
    >
      <FormAlert message={message} />

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" autoComplete="on">
        <FormInput
          label="Full name"
          name="name"
          value={form.name}
          onChange={updateField}
          placeholder="Your name"
          autoComplete="name"
          required
        />

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
          placeholder="Minimum 8 characters"
          autoComplete="new-password"
          required
        />

        <PasswordInput
          label="Confirm password"
          name="password_confirmation"
          value={form.password_confirmation}
          onChange={updateField}
          placeholder="Repeat password"
          autoComplete="new-password"
          required
        />

        <button className="btn-primary" disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have account?{" "}
        <Link className="font-semibold text-blue-600 hover:text-blue-700" to="/login">
          Login
        </Link>
      </p>
    </AuthShell>
  );
}