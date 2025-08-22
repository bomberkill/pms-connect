import { Loader2 } from "lucide-react";

export default function CustomLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 opacity-40 transition-opacity z-50">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
    </div>
  );
}