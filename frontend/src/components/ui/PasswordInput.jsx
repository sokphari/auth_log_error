import { useState } from "react";

export default function PasswordInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
  required = false,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="relative">
        <input
          className="input pr-20"
          type={showPassword ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
        />

        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}