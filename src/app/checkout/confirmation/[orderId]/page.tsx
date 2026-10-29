import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { OrderConfirmationContent } from "./OrderConfirmationContent";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default function OrderConfirmationPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F6F0E7] flex items-center justify-center pt-20">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#C58A4A] mx-auto" />
            <p className="text-sm font-medium text-[#3B241A]">
              Loading order confirmation...
            </p>
          </div>
        </div>
      }
    >
      <OrderConfirmationContent params={params} />
    </Suspense>
  );
}
