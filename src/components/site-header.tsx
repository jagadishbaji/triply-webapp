import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { logout } from "@/services/authService"
import { useRouter } from "next/navigation";

export function SiteHeader() {
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 bg-gradient-to-r from-green-50 via-white to-green-100 border-b-0 shadow-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-16">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        {/* Sidebar Trigger (optional, uncomment if needed) */}
        {/* <SidebarTrigger /> */}

        
        <h1 className="text-xl font-extrabold text-gray-800 tracking-tight bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
       
        </h1>

        <div className="ml-auto flex items-center gap-4">
          {/* User Avatar (optional, add your avatar logic here) */}
          {/* <img src="/avatars/shadcn.jpg" alt="User" className="w-9 h-9 rounded-full border-2 border-green-400 shadow" /> */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-green-700 hover:text-white hover:bg-gradient-to-r hover:from-green-500 hover:to-green-700 font-semibold rounded-xl transition"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
