import { useEffect } from "react";

interface ToastProps {
  message: string;
  isVisible: boolean;
  onHide: () => void;
  type?: "success" | "error"; // success = vert, error = rouge
}

export function Toast({
  message,
  isVisible,
  onHide,
  type = "success",
}: ToastProps) {
  // Auto-hide after 2 seconds
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(onHide, 2000);
    return () => clearTimeout(timer);
  }, [isVisible, onHide]);

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed top-6 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg
        text-white text-sm font-medium
        transition-all duration-300
        ${type === "success" ? "bg-green-500" : "bg-red-500"}
      `}
    >
      <span>{type === "success" ? "✓" : "✕"}</span>
      <span>{message}</span>
    </div>
  );
}
