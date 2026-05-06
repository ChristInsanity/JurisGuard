import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function DashboardIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
      <path fill="currentColor" d="M3 3h6v6H3V3Zm8 0h6v6h-6V3ZM3 11h6v6H3v-6Zm8 0h6v6h-6v-6Z" />
    </svg>
  );
}

function GavelIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
      <path fill="currentColor" d="m7.4 2 4.6 4.6-1.4 1.4L9.4 6.8 6.8 9.4 8 10.6 6.6 12 2 7.4 3.4 6l1.2 1.2 2.6-2.6L6 3.4 7.4 2Zm5.2 7.4 5 5-1.4 1.4-5-5 1.4-1.4ZM4 16h8v2H4v-2Z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
      <path fill="currentColor" d="M3 3h7v2H5v10h5v2H3V3Zm10.6 3.4L17.2 10l-3.6 3.6-1.4-1.4 1.2-1.2H8V9h5.4l-1.2-1.2 1.4-1.4Z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
      <path fill="currentColor" d="M10 2 3.5 4.3v5.2c0 4.1 2.7 7 6.5 8.5 3.8-1.5 6.5-4.4 6.5-8.5V4.3L10 2Zm2.9 6.7-3.4 3.4-1.6-1.6 1.1-1.1.5.5 2.3-2.3 1.1 1.1Z" />
    </svg>
  );
}

const navigation = [
  { label: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
  { label: "Criminal Cases", path: "/cases", icon: <GavelIcon /> },
];

export default function Sidebar() {
  const location = useLocation();
  const { logout, user } = useAuth();

  const visibleNavigation = user?.role === "admin"
    ? [...navigation, { label: "Verification", path: "/admin/verification", icon: <ShieldIcon /> }]
    : navigation;

  const itemClass = (path: string) =>
    location.pathname === path || (path !== "/dashboard" && location.pathname.startsWith(path))
      ? "bg-[#2f80ed] text-white shadow-sm"
      : "text-[#6b7280] hover:-translate-y-px hover:bg-[#2f80ed] hover:text-white hover:shadow-sm";

  return (
    <aside className="border-b border-[#e5e7eb] bg-[#f5f5f5] px-5 py-5 lg:min-h-screen lg:w-60 lg:border-b-0 lg:border-r">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[#1f2937]">JurisGuard</h1>
      </div>

      <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-0 lg:overflow-visible">
        {visibleNavigation.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`mb-1.5 flex h-[42px] items-center gap-2 whitespace-nowrap rounded-[10px] px-3.5 text-sm font-medium transition duration-200 ${itemClass(item.path)}`}
          >
            <span className="shrink-0">
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
        <button
          onClick={logout}
          className="mt-3 flex h-[42px] items-center gap-2 rounded-[10px] px-3.5 text-left text-sm font-medium text-[#dc3545] transition duration-200 hover:-translate-y-px hover:bg-[#2f80ed] hover:text-white hover:shadow-sm"
        >
          <LogoutIcon />
          Logout
        </button>
      </nav>
    </aside>
  );
}
