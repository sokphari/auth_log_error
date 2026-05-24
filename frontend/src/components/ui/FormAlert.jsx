export default function FormAlert({ message, type = "error" }) {
  if (!message) {
    return null;
  }

  const styles = {
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-green-200 bg-green-50 text-green-700",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
  };

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${styles[type]}`}>
      {message}
    </div>
  );
}