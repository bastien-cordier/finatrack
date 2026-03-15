import { useState, useCallback } from "react";

export function useToast() {
  const [toast, setToast] = useState<{
    message: string;
    isVisible: boolean;
    type: "success" | "error";
  }>({
    message: "",
    isVisible: false,
    type: "success",
  });

  // Show a toast message
  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToast({ message, isVisible: true, type });
    },
    [],
  );

  // Hide the toast
  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  }, []);

  return { toast, showToast, hideToast };
}
