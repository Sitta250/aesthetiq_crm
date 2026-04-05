import { Suspense } from "react";
import PipelineBoard from "@/components/pipeline/PipelineBoard";

export default function PipelinePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-zinc-500">Loading pipeline…</p>
        </div>
      }
    >
      <PipelineBoard />
    </Suspense>
  );
}
