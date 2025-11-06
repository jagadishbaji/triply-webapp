"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { CheckCircle } from "lucide-react";

interface BookingSuccessModalProps {
  open: boolean;
  onClose: () => void;
}

export default function BookingSuccessModal({ open, onClose }: BookingSuccessModalProps) {
  const router = useRouter();

  // Automatically redirect after 10 seconds
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        handleClose();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleClose = () => {
    onClose();
    router.push("/user/mybookings");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 rounded-2xl overflow-hidden shadow-xl bg-white">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center p-8"
        >
          {/* ✅ Lottie Animation */}
          <div className="w-44 h-44 mb-6">
            <DotLottieReact
              src="https://lottie.host/ab4408dc-62a3-44d9-a5f0-3768365d962b/y6PlvFurUa.lottie"
              autoplay
              loop={false}
            />
          </div>

          {/* ✅ Success Message */}
          <h2 className="text-2xl font-bold text-green-700 flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Booking Success!
          </h2>

          <p className="text-gray-700 text-center mt-3 leading-relaxed px-2">
            Agent will review your booking details and call you shortly.
            <br />
            <span className="font-medium text-green-700">
              Thank you for choosing Triply Cars!
            </span>
          </p>

          <p className="text-xs text-gray-400 mt-4">
            Redirecting to your bookings in 10 seconds...
          </p>

          {/* ✅ Manual Close Button */}
          <motion.button
            onClick={handleClose}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
          >
            Go to My Bookings
          </motion.button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
