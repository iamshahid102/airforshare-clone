import { useState } from "react";
import TextComp from "../TextComp/TextComp";
import FileComp from "../FileComp/FileComp";
import { HiOutlineMenuAlt2 } from "react-icons/hi";
import { PiFilesFill } from "react-icons/pi";
import "./Sidebar.css";

const Sidebar = () => {
  const [sideToggle, setSideToggle] = useState("text");

  return (
    <div className="side-bar-container">
      <div className="side-icons">
        <button
          className={`btn ${sideToggle === "text" ? "btn-color" : ""}`}
          onClick={() => setSideToggle("text")}
        >
          <HiOutlineMenuAlt2 />
        </button>
        <button
          className={`btn ${sideToggle === "file" ? "btn-color" : ""}`}
          onClick={() => setSideToggle("file")}
        >
          <PiFilesFill />
        </button>
      </div>
      <div className="upload-area">
        {sideToggle === "text" ? <TextComp /> : <FileComp />}
      </div>
    </div>
  );
};

export default Sidebar;
