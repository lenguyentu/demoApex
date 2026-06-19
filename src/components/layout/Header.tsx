import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Bell, 
  LogOut, 
  User, 
  ChevronDown, 
  Menu
} from "lucide-react";
import { useUnreadCount } from "../../features/notifications/hooks";
import { NotificationDropdown } from "../../features/notifications/components/NotificationDropdown";
import { useAuthStore } from "../../features/auth/store";
import { useLogout } from "../../features/auth/hooks";

export const Header = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const logoutMutation = useLogout();
  const { data: unreadCount = 0 } = useUnreadCount();
  
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Detect scroll for styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/login");
      }
    });
  };

  return (
    <header 
      className={`
        sticky top-0 z-40 h-16 w-full
        flex items-center justify-between px-6
        transition-all duration-200 ease-in-out
        ${isScrolled 
          ? "bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50" 
          : "bg-white border-b border-gray-200"}
      `}
    >
      {/* Left Section: Mobile Menu Trigger (if needed) */}
      <div className="flex items-center gap-4">
        <button className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
          <Menu size={20} />
        </button> 
        {/* Page Title removed as requested */}
      </div>

      {/* Middle: Spacer */}
      <div className="flex-1"></div>

      {/* Right Section: Actions */}
      <div className="flex items-center gap-3">
        
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={`
              relative p-2.5 rounded-full transition-all duration-200 group
              ${isNotifOpen ? "bg-brand-50 text-brand-600" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}
            `}
          >
            <Bell size={20} className={`transition-transform duration-300 ${isNotifOpen ? 'rotate-12' : 'group-hover:rotate-12'}`} />
            {unreadCount > 0 && (
              <span className="
                absolute top-1.5 right-1.5 
                flex h-2.5 w-2.5
              ">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
              </span>
            )}
          </button>
          
          <div className={`absolute right-0 mt-3 w-80 sm:w-96 transform transition-all duration-200 origin-top-right z-50 ${isNotifOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
            <NotificationDropdown
              isOpen={isNotifOpen}
              onClose={() => setIsNotifOpen(false)}
              unreadCount={unreadCount}
            />
          </div>
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-gray-200 mx-1"></div>

        {/* User Profile */}
        <div ref={profileRef} className="relative">
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`
              flex items-center gap-3 pl-1 pr-3 py-1 rounded-full border transition-all duration-200
              ${isProfileOpen 
                ? "bg-brand-50/50 border-brand-200 ring-2 ring-brand-100" 
                : "border-transparent hover:bg-gray-50 hover:border-gray-200"}
            `}
          >
            <div className="
              h-8 w-8 rounded-full 
              bg-gray-100 text-gray-500
              flex items-center justify-center 
              shadow-sm ring-2 ring-white
            ">
              <User size={18} />
            </div>
            
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-semibold text-gray-700 leading-none">
                {user?.full_name?.split(' ').slice(-1)[0] || 'User'}
              </span>
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mt-0.5">
                {user?.role || "Guest"}
              </span>
            </div>

            <ChevronDown 
              size={14} 
              className={`text-gray-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} 
            />
          </button>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div className="
              absolute right-0 mt-3 w-56 
              bg-white rounded-2xl shadow-xl 
              border border-gray-100 
              overflow-hidden 
              animate-fade-in-up origin-top-right
              z-50
            ">
              {/* User Info Header (Mobile) */}
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 md:hidden">
                <p className="text-sm font-bold text-gray-900">{user?.full_name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>

              <div className="p-2 space-y-1">
                <Link 
                  to="/profile" 
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 rounded-xl hover:bg-brand-50 hover:text-brand-600 transition-colors group"
                >
                  <div className="p-1.5 rounded-lg bg-gray-100 text-gray-500 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                    <User size={16} />
                  </div>
                  Hồ sơ cá nhân
                </Link>
                
                <div className="h-px bg-gray-100 my-1 mx-2"></div>
                
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors group"
                >
                  <div className="p-1.5 rounded-lg bg-red-50 text-red-500 group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                    <LogOut size={16} />
                  </div>
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
