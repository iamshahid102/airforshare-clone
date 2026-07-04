import { useState, useCallback, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { signOut } from "firebase/auth";
import { message } from "antd";
import { auth } from "../../config/firebase";
import logo from "../../assets/logo.svg";
import logoMini from "../../assets/logo-mini.svg";
import {
  RxHamburgerMenu,
  RxCross2,
  RxExit,
  RxPerson,
  RxEnvelopeClosed,
} from "react-icons/rx";
import {
  getUserProfile,
  getDisplayName,
  getInitials,
} from "../../services/userService";

const Navbar = () => {
  const [toggle, setToggle] = useState(false);
  const [user] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Fetch user profile from Firestore
  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.uid) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (err) {
          console.error("Error fetching user profile:", err);
        }
      } else {
        setUserProfile(null);
      }
    };
    fetchProfile();
  }, [user]);

  const closeMenu = useCallback(() => setToggle(false), []);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut(auth);
      setUserProfile(null);
      message.success("Logged out successfully.");
      closeMenu();
    } catch {
      message.error("Failed to log out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  const displayName = getDisplayName(userProfile, user);
  const initials = getInitials(displayName);

  return (
    <nav className="flex items-center justify-between relative my-5 sm:my-8 md:my-12 lg:my-[50px]">
      {/* Logo */}
      <Link to="/" className="flex items-center shrink-0" onClick={closeMenu}>
        <img
          src={logo}
          alt="AirForShare logo"
          className="hidden sm:block h-8 md:h-10"
        />
        <img src={logoMini} alt="AirForShare" className="block sm:hidden h-8" />
      </Link>

      {/* Mobile Overlay */}
      {toggle && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Navigation Links */}
      <ul
        className={`${
          toggle ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        } md:translate-x-0 md:opacity-100 flex flex-col md:flex-row items-stretch md:items-center justify-start md:justify-end gap-0 md:gap-6 lg:gap-8 w-full md:w-auto fixed md:static top-0 right-0 h-full md:h-auto bg-white md:bg-transparent p-6 md:p-0 z-40 transition-all duration-300 ease-in-out shadow-2xl md:shadow-none`}
      >
        {/* Mobile close button */}
        <li className="flex justify-end mb-6 md:hidden">
          <button
            onClick={closeMenu}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
            aria-label="Close menu"
          >
            <RxCross2 size={22} />
          </button>
        </li>

        {user ? (
          <>
            {/* Logged In State */}
            <li className="flex items-center gap-3 border-b md:border-0 border-gray-100 py-4 md:py-0 mb-2 md:mb-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-sm font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate max-w-[180px]">
                  {displayName}
                </p>
                {userProfile?.fullName && user.email && (
                  <p className="text-xs text-gray-400 truncate max-w-[180px] flex items-center gap-1">
                    <RxEnvelopeClosed size={10} />
                    {user.email}
                  </p>
                )}
              </div>
            </li>
            <li className="py-3 md:py-0">
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full md:w-auto inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium border-2 hover:border-red-800 text-gray-500 hover:text-red-800 hover:bg-red-100 rounded-xl transition-all duration-200 cursor-pointer hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed gap-2"
              >
                {isSigningOut && (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
                )}
                <RxExit size={16} className={isSigningOut ? "hidden" : ""} />
                {isSigningOut ? "Signing out..." : "Logout"}
              </button>
            </li>
          </>
        ) : (
          <>
            {/* Logged Out State */}
            <li className="border-b md:border-0 border-gray-100 py-3 md:py-0">
              <NavLink
                to="/login"
                className="block py-2 md:py-0 text-sm font-semibold text-primary hover:text-primary-dark transition-colors duration-200 flex items-center gap-2"
                onClick={closeMenu}
              >
                <RxPerson size={16} />
                Login
              </NavLink>
            </li>
            <li className="py-3 md:py-0">
              <NavLink
                to="/signup"
                className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary-dark transition-all duration-200 hover:shadow-md gap-2"
                onClick={closeMenu}
              >
                Sign Up
              </NavLink>
            </li>
          </>
        )}
      </ul>

      {/* Hamburger Menu Button */}
      <button
        className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-700 z-50 relative"
        onClick={() => setToggle(!toggle)}
        aria-label="Toggle navigation menu"
      >
        <RxHamburgerMenu size={24} />
      </button>
    </nav>
  );
};

export default Navbar;
