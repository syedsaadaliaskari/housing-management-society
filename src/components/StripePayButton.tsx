"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  billId: number;
  amount: number;
  description: string;
};

export function StripePayButton({ billId, amount, description }: Props) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/resident/bills/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billId, amount, description }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Payment error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePay}
      disabled={loading}
      className="bg-green-600 hover:bg-green-700 text-white"
    >
      {loading ? "Redirecting..." : "Pay with Stripe"}
    </Button>
  );
}
