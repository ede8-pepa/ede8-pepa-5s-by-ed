import type { AppwriteConnectionState } from "@/lib/types";
import { cx } from "@/lib/utils";

export function AppwriteStatus({
  status,
}: {
  status: AppwriteConnectionState;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center justify-center rounded-lg border px-4 py-3 text-sm font-black shadow-sm",
        status.connected
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700",
      )}
    >
      {status.connected ? "Appwrite connecté" : "Appwrite non connecté"}
    </span>
  );
}
