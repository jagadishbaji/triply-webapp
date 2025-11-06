import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClipboardList, User, LogOut, LayoutDashboard, SearchCheck } from "lucide-react";

type Props = {
  onLogout: () => Promise<void>;
  title?: string;
};

export function UserHeader({ onLogout, title = "User Area" }: Props) {
  return (
    <header className="flex items-center justify-between px-6 md:px-10 py-4 bg-white/90 backdrop-blur-md shadow-xl rounded-3xl border border-green-100 mx-4 mt-4 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
          <span className="bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
            {title}
          </span>
        </h1>
      </div>
      <nav className="flex items-center gap-3 md:gap-4">
        <Link href="/user/dashboard">
          <Button variant="ghost" className="gap-2 text-green-700 hover:bg-green-50 rounded-xl font-semibold">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Button>
        </Link>
        <Link href="/user/vehicles">
          <Button variant="ghost" className="gap-2 text-green-700 hover:bg-green-50 rounded-xl font-semibold">
            <SearchCheck className="w-5 h-5" />
            Search
          </Button>
        </Link>
        <Link href="/user/mybookings">
          <Button variant="ghost" className="gap-2 text-green-700 hover:bg-green-50 rounded-xl font-semibold">
            <ClipboardList className="w-5 h-5" />
            My Bookings
          </Button>
        </Link>
        <Link href="/user/profile">
          <Button variant="ghost" className="gap-2 text-green-700 hover:bg-green-50 rounded-xl font-semibold">
            <User className="w-5 h-5" />
            Profile
          </Button>
        </Link>
        <Button
          variant="ghost"
          className="gap-2 text-green-700 hover:text-white hover:bg-gradient-to-r hover:from-green-500 hover:to-green-700 font-semibold rounded-xl"
          onClick={onLogout}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </nav>
    </header>
  );
}

export default UserHeader;