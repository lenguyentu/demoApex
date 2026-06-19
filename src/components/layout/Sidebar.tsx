import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  UserCircle,
  Building2,
  Briefcase,
  ListChecks,
  Users,
  Bell,
  MessageCircle,
  BarChart,
  BarChart2,
  UserCog,
  User,
  ChevronDown,
  ClipboardList,
  PanelLeftClose,
  PanelLeftOpen,
  Calendar,
  PieChart,
  Megaphone,
  History,
  Palette,
  CircleDollarSign,
  FileText,
  CalendarOff,
  Globe,
  Settings,
  Inbox,
} from "lucide-react";
import { useAuthStore } from "../../features/auth/store";
import { useUnreadCount } from "../../features/notifications/hooks";
import { useChatUnreadCount } from "../../features/chat/hooks";
import { PERMISSIONS } from "../../features/auth/constants";

interface NavItem {
  name: string;
  path?: string;
  icon: React.ReactNode;
  subItems?: { name: string; path: string; permission?: string; icon?: React.ReactNode }[];
  permission?: string;
}

const MENU_ITEMS: NavItem[] = [
  {
    name: "Dashboard",
    icon: <LayoutGrid />,
    subItems: [
      { name: "Overview", path: "/", icon: <BarChart />, permission: PERMISSIONS.VIEW_DASHBOARD },
      { name: "Freelancer Management", path: "/freelancer-management", icon: <UserCog />, permission: PERMISSIONS.MANAGE_USERS }
    ]
  },

  {
    name: "Candidates",
    icon: <UserCircle />,
    permission: PERMISSIONS.VIEW_CANDIDATES,
    subItems: [
      { name: "My Candidates", path: "/candidates/my" },
      { name: "Candidate Database", path: "/candidates" }
    ]
  },
  { name: "Clients", path: "/clients", icon: <Building2 />, permission: PERMISSIONS.VIEW_CLIENTS },
  {
    name: "Jobs",
    icon: <Briefcase />,
    permission: PERMISSIONS.VIEW_JOBS,
    subItems: [
      { name: "Open Job", path: "/jobs/open" },
      { name: "Admin Job", path: "/jobs/admin", permission: PERMISSIONS.UPDATE_JOB }
    ]
  },
  { name: "Processes", path: "/processes", icon: <ListChecks />, permission: PERMISSIONS.VIEW_PROCESSES },
  { name: "Daily Plan", path: "/daily-plan", icon: <ClipboardList /> },
  {
    name: "Landing Page",
    icon: <Globe />,
    subItems: [
      { name: "Setup", path: "/landing/setup", icon: <Settings size={20} /> },
      { name: "CV Queue", path: "/landing/queue", icon: <Inbox size={20} /> },
    ],
  },
  {
    name: "Research",
    icon: <ClipboardList />,
    permission: PERMISSIONS.VIEW_RESEARCH_QUEUE,
    subItems: [
      { name: "Dashboard", path: "/research/dashboard", icon: <BarChart /> },
      { name: "Queue",     path: "/research/queue",     icon: <ListChecks /> },
      { name: "Quản lý Daily Plan", path: "/manage-daily-plans", icon: <CalendarOff />, permission: PERMISSIONS.MANAGE_USERS },
    ],
  },
  { name: "Users", path: "/users", icon: <Users />, permission: PERMISSIONS.MANAGE_USERS },
  { name: "Notifications", path: "/notifications", icon: <Bell />, permission: PERMISSIONS.VIEW_DASHBOARD },
  { name: "Chat", path: "/chat", icon: <MessageCircle />, permission: PERMISSIONS.VIEW_CHAT },
  {
    name: "BD CRM",
    icon: <Users />,
    permission: PERMISSIONS.MANAGE_CLIENTS,
    subItems: [
      { name: "Customer List", path: "/bd/customers", icon: <Users /> },
      { name: "Schedule Management", path: "/bd/schedule", icon: <Calendar /> },
      { name: "CRM Statistic", path: "/bd/statistic", icon: <PieChart /> },
    ]
  },
  {
    name: "Sales",
    icon: <CircleDollarSign />,
    permission: PERMISSIONS.VIEW_ALL_SALES,
    subItems: [
      { name: "Dữ liệu chung", path: "/sales/data" },
      { name: "Công nợ", path: "/sales/debt" },
      { name: "Dashboard doanh thu", path: "/sales/dashboard" },
      { name: "Hoa hồng", path: "/sales/commission" },
    ]
  }
];

const OTHER_ITEMS: NavItem[] = [
  { name: "Profile", path: "/profile", icon: <User /> },
];



export interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export const Sidebar = ({ isExpanded, onToggle }: SidebarProps) => {
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState<{ type: string; index: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const isMobileOpen = false; // Placeholder for mobile state
  const { can } = useAuthStore();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: chatUnreadCount = 0 } = useChatUnreadCount();

  // Combine isExpanded and isHovered to determine display state
  const showExpanded = isExpanded || isHovered || isMobileOpen;

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    // Exact match for submenu paths to avoid /candidates matching /candidates/my
    if (path === "/candidates" || path === "/candidates/my") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleSubmenuToggle = (index: number, type: string) => {
    if (openSubmenu?.type === type && openSubmenu?.index === index) {
      setOpenSubmenu(null);
    } else {
      setOpenSubmenu({ type, index });
    }
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others" | "bd") => (
    <ul className="flex flex-col gap-1">
      {items.map((nav, index) => {
        // Check permission if it exists
        if (nav.permission && !can(nav.permission)) return null;

        return (
          <li key={nav.name}>
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`relative flex items-center w-full gap-3 px-3 py-2 font-medium rounded-lg text-sm group ${openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                  } cursor-pointer justify-start`}
              >
                <span
                  className={`flex shrink-0 items-center justify-center size-6 ${openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? "text-brand-500 dark:text-brand-400"
                      : "text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
                    }`}
                >
                  {React.isValidElement(nav.icon) && React.cloneElement(nav.icon as React.ReactElement<any>, { size: 20 })}
                </span>
                {showExpanded && (
                  <span className="flex-1 text-left whitespace-nowrap overflow-hidden transition-all duration-300">{nav.name}</span>
                )}
                {showExpanded && (
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${openSubmenu?.type === menuType &&
                        openSubmenu?.index === index
                        ? "rotate-180 text-brand-500"
                        : "text-gray-500 items-center"
                      }`}
                  />
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  to={nav.path}
                  className={`relative flex items-center w-full gap-3 px-3 py-2 font-medium rounded-lg text-sm group ${isActive(nav.path)
                      ? "bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                    }`}
                >
                  <span
                    className={`flex shrink-0 items-center justify-center size-6 ${isActive(nav.path)
                        ? "text-brand-500 dark:text-brand-400"
                        : "text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
                      }`}
                  >
                    {React.isValidElement(nav.icon) && React.cloneElement(nav.icon as React.ReactElement<any>, { size: 20 })}
                  </span>
                  {showExpanded && (
                    <div className="flex items-center justify-between w-full overflow-hidden">
                      <span className="whitespace-nowrap">{nav.name}</span>
                      {nav.name === 'Notifications' && unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                      {nav.name === 'Chat' && chatUnreadCount > 0 && (
                        <span className="inline-block w-2.5 h-2.5 bg-red-500 rounded-full ml-auto"></span>
                      )}
                    </div>
                  )}
                </Link>
              )
            )}
            {nav.subItems && showExpanded && openSubmenu?.type === menuType && openSubmenu?.index === index && (
              <ul className="mt-1 space-y-1 ml-9">
                {nav.subItems.map((subItem) => {
                  // Permission check for subitems
                  if (subItem.permission && !can(subItem.permission)) return null;

                  return (
                    <li key={subItem.name}>
                      <Link
                        to={subItem.path}
                        className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive(subItem.path)
                            ? "bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"
                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                          }`}
                      >
                        {subItem.icon && (
                          <span className={`flex shrink-0 items-center justify-center size-5 ${isActive(subItem.path)
                              ? "text-brand-500 dark:text-brand-400"
                              : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600"
                            }`}>
                            {React.isValidElement(subItem.icon) && React.cloneElement(subItem.icon as React.ReactElement<any>, { size: 18 })}
                          </span>
                        )}
                        <span className="whitespace-nowrap">{subItem.name}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`fixed top-0 left-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen transition-all duration-300 ease-in-out z-50 flex flex-col p-5
        ${showExpanded ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "translate-x-0"}`}
    >
      <div className="flex items-center justify-between mb-8 ml-1">
        <div className={`flex items-center gap-3 transition-opacity duration-200 ${showExpanded ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
          <img src="/logo2.png" alt="Apex Logo" className="h-10 w-auto" />
        </div>

        {/* Toggle Button - Only show when expanded or when collapsed (centered) */}
        <button
          onClick={onToggle}
          className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-all ${!showExpanded ? 'mx-auto' : ''}`}
          title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto no-scrollbar"
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="mb-6">
          <div className={`text-xs font-medium text-gray-400 mb-4 px-3 uppercase tracking-wider transition-opacity duration-200 ${showExpanded ? 'opacity-100' : 'opacity-0 hidden'}`}>
            Menu
          </div>
          {renderMenuItems(MENU_ITEMS, "main")}

          {/* HH Lead — QUẢN LÝ TEAM */}
          {can('view_processes') && !can('admin_only') && (
            <>
              <div className="mt-4">
                <div className={`text-xs font-medium text-gray-400 mb-2 px-3 uppercase tracking-wider transition-opacity duration-200 ${showExpanded ? 'opacity-100' : 'opacity-0 hidden'}`}>
                  Quản lý Team
                </div>
                <ul className="flex flex-col gap-1">
                  {[
                    { path: '/manager/team',  label: 'Report tháng', icon: <Users size={20} /> },
                  ].map(item => (
                    <li key={item.path}>
                      <Link to={item.path}
                        className={`relative flex items-center w-full gap-3 px-3 py-2 font-medium rounded-lg text-sm group ${isActive(item.path)
                          ? 'bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'}`}
                      >
                        <span className="flex shrink-0 items-center justify-center size-6 text-gray-500 group-hover:text-gray-700 dark:text-gray-400">
                          {item.icon}
                        </span>
                        {showExpanded && <span className="whitespace-nowrap">{item.label}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Headhunter + HH Lead — CÔNG VIỆC CÁ NHÂN (KHÔNG hiện cho Admin) */}
          {can('view_processes') && !can('admin_only') && (
            <>
              <div className="mt-4">
                <div className={`text-xs font-medium text-gray-400 mb-2 px-3 uppercase tracking-wider transition-opacity duration-200 ${showExpanded ? 'opacity-100' : 'opacity-0 hidden'}`}>
                  Công việc
                </div>
                <ul className="flex flex-col gap-1">
                  {[
                    { path: '/hh/jobs',       label: 'Job Focus',      icon: <Briefcase size={20} /> },
                    { path: '/hh/kpi',        label: 'KPI Tracker',    icon: <BarChart2 size={20} /> },
                    { path: '/hh/report',     label: 'Weekly Report',  icon: <FileText size={20} /> },
                  ].map(item => (
                    <li key={item.path}>
                      <Link to={item.path}
                        className={`relative flex items-center w-full gap-3 px-3 py-2 font-medium rounded-lg text-sm group ${isActive(item.path)
                          ? 'bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'}`}
                      >
                        <span className="flex shrink-0 items-center justify-center size-6 text-gray-500 group-hover:text-gray-700 dark:text-gray-400">
                          {item.icon}
                        </span>
                        {showExpanded && <span className="whitespace-nowrap">{item.label}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Admin — MANAGER */}
          {can('admin_only') && (
            <div className="mt-4">
              <div className={`text-xs font-medium text-gray-400 mb-2 px-3 uppercase tracking-wider transition-opacity duration-200 ${showExpanded ? 'opacity-100' : 'opacity-0 hidden'}`}>
                Manager
              </div>
              <ul className="flex flex-col gap-1">
                {[
                  { path: '/manager/team',    label: 'Report tháng', icon: <Users size={20} /> },
                  { path: '/hh/jobs',         label: 'Job Focus',      icon: <Briefcase size={20} /> },
                  { path: '/hh/kpi',          label: 'KPI Tracker',    icon: <BarChart2 size={20} /> },
                  { path: '/hh/report',       label: 'Weekly Report',  icon: <FileText size={20} /> },
                ].map(item => (
                  <li key={item.path}>
                    <Link to={item.path}
                      className={`relative flex items-center w-full gap-3 px-3 py-2 font-medium rounded-lg text-sm group ${isActive(item.path)
                        ? 'bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'}`}
                    >
                      <span className="flex shrink-0 items-center justify-center size-6 text-gray-500 group-hover:text-gray-700 dark:text-gray-400">
                        {item.icon}
                      </span>
                      {showExpanded && <span className="whitespace-nowrap">{item.label}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Admin Section - System */}
          {can('admin_only') && (
            <div className="mt-4">
              <div className={`text-xs font-medium text-gray-400 mb-2 px-3 uppercase tracking-wider transition-opacity duration-200 ${showExpanded ? 'opacity-100' : 'opacity-0 hidden'}`}>
                System
              </div>
          
              <Link
                to="/admin/audit-logs"
                className={`relative flex items-center w-full gap-3 px-3 py-2 font-medium rounded-lg text-sm group ${isActive("/admin/audit-logs")
                    ? "bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                  }`}
              >
                <span className="flex shrink-0 items-center justify-center size-6 text-gray-500 group-hover:text-gray-700 dark:text-gray-400">
                  <ClipboardList size={20} />
                </span>
                {showExpanded && <span className="whitespace-nowrap">Audit Log</span>}
              </Link>
            </div>
          )}


        </div>

        <div>
          <div className={`text-xs font-medium text-gray-400 mb-4 px-3 uppercase tracking-wider transition-opacity duration-200 ${showExpanded ? 'opacity-100' : 'opacity-0 hidden'}`}>
            Others
          </div>
          {renderMenuItems(OTHER_ITEMS, "others")}
        </div>
      </div>

      {showExpanded && (
        <div className="mt-auto p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl whitespace-nowrap overflow-hidden animate-fade-in">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">TD Consulting</h4>
          <p className="text-xs text-gray-400 mt-1">Đối tác tuyển dụng tin cậy của bạn.</p>
          <button onClick={() => window.open("https://tdconsulting.vn", "_blank")} className="mt-3 w-full bg-brand-500 text-white text-xs font-medium py-2 rounded-lg hover:bg-brand-600 transition shadow-sm">
            Ghé thăm Website
          </button>
        </div>
      )}
    </aside>
  );
};
