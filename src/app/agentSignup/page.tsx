"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { createAgent } from "@/services/agentsService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phoneNumber: z.string().regex(/^[0-9]{10}$/, "Phone must be 10 digits"),
  address: z.string().min(1, "Address is required"),
  licenseNumber: z.string().min(1, "License Number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupForm = z.infer<typeof signupSchema>;

export default function AgentSignupPage() {
  const router = useRouter();
  const [openDialog, setOpenDialog] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSignup = async (data: SignupForm) => {
    try {
      await createAgent({
        ...data,
        isActive: false, // new agents start as inactive, require admin approval
      });
      reset();
      setOpenDialog(true); // open success dialog
    } catch (error) {
      console.error(error);
      alert("Signup failed. Please try again."); // fallback
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    router.push("/"); // redirect to home page
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold">Agent Signup</h1>
        <form onSubmit={handleSubmit(onSignup)} className="space-y-4">
          <div>
            <input
              {...register("name")}
              placeholder="Full Name"
              className="w-full rounded border p-2"
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>
          <div>
            <input
              {...register("email")}
              placeholder="Email"
              className="w-full rounded border p-2"
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>
          <div>
            <input
              {...register("phoneNumber")}
              placeholder="Phone (10 digits)"
              className="w-full rounded border p-2"
            />
            {errors.phoneNumber && (
              <p className="text-red-500 text-sm">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>
          <div>
            <input
              {...register("address")}
              placeholder="Address"
              className="w-full rounded border p-2"
            />
            {errors.address && (
              <p className="text-red-500 text-sm">{errors.address.message}</p>
            )}
          </div>
          <div>
            <input
              {...register("licenseNumber")}
              placeholder="License Number"
              className="w-full rounded border p-2"
            />
            {errors.licenseNumber && (
              <p className="text-red-500 text-sm">
                {errors.licenseNumber.message}
              </p>
            )}
          </div>
          <div>
            <input
              {...register("password")}
              type="password"
              placeholder="Password"
              className="w-full rounded border p-2"
            />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing up..." : "Sign Up"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Login
          </a>
        </p>
      </div>

      {/* Success Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signup Successful 🎉</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            You have successfully signed up! We’ll notify you once the admin
            approves your account.
          </p>
          <DialogFooter>
            <Button onClick={handleDialogClose}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
