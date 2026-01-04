import { LoaderCircle } from "lucide-react";

export default function Loader() {
  return (
    <div className="w-full h-screen flex items-center justify-center p-4">
      <LoaderCircle className="animate-spin text-amber-500 w-12 h-12" />
    </div>
  );
}
