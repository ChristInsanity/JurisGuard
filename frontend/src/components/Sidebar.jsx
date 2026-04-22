import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const location = useLocation();
  const { logout } = useAuth();

  const isActive = (path) =>
    location.pathname === path
      ? "bg-blue-500 text-white"
      : "text-gray-500 hover:bg-blue-500 hover:text-white";

  return (
    <div className="w-64 bg-gray-100 border-r min-h-screen p-5">

      <h2 className="text-xl font-bold text-gray-800 mb-6">
        PAO Admin
      </h2>

      <nav className="flex flex-col space-y-2">
        
        <Link to="/dashboard" className={`p-2 rounded ${isActive("/dashboard")}`}>
          Dashboard
        </Link>

        <Link to="/cases" className={`p-2 rounded ${isActive("/cases")}`}>
          Criminal Cases
        </Link>

        <button
          onClick={logout}
          className="text-red-500 mt-6 text-left"
        >
          Logout
        </button>

      </nav>
    </div>
  );
}