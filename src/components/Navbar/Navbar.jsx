import { NavLink } from "react-router-dom";
import logo from "../../assets/logo.svg";
import logo_mini from "../../assets/logo-mini.svg";
import { RxHamburgerMenu } from "react-icons/rx";
import "./Navbar.css";
import { useState } from "react";

const Navbar = () => {
  const [toggle, setToggle] = useState(false);

  return (
    <nav className="navbar">
      <div className="logo">
        <img src={logo} alt="airforshare logo icon" />
        <img src={logo_mini} alt="airforshare logo icon" />
      </div>
      <ul className={`nav-list ${toggle ? "" : "hide-menu"}`}>
        <li>
          <NavLink>How it works</NavLink>
        </li>
        <li>
          <NavLink>Download</NavLink>
        </li>
        <li>
          <NavLink>Upgrade</NavLink>
        </li>
        <li>
          <NavLink>Feedback</NavLink>
        </li>
        <li className="auth-link">
          <NavLink>Login / Register</NavLink>
        </li>
      </ul>
      <button className="menu-icon btn" onClick={() => setToggle(!toggle)}>
        <RxHamburgerMenu />
      </button>
    </nav>
  );
};

export default Navbar;
