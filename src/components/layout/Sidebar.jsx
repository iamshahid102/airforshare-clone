import { useState, useCallback } from "react";
import TextPanel from "../features/TextPanel";
import FilePanel from "../features/FilePanel";
import { HiOutlineMenuAlt2 } from "react-icons/hi";
import { PiFilesFill } from "react-icons/pi";

const Sidebar = ({ user, onShareText, onShareFiles, onDataLoaded }) => {
  const [activeTab, setActiveTab] = useState("text");

  const handleTabChange = useCallback((tab) => setActiveTab(tab), []);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-start w-full bg-white rounded-2xl sm:rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.08)] overflow-hidden">
      {/* Icon Tabs */}
      <div className="flex sm:flex-row md:flex-col w-full sm:w-[72px] md:w-[80px] lg:w-[88px] bg-gray-50/80 border-b sm:border-b-0 sm:border-r border-gray-100">
        <button
          className={`flex-1 sm:flex-none w-full py-4 sm:py-5 flex items-center justify-center text-2xl sm:text-[1.6rem] border-none cursor-pointer transition-all duration-200 ${
            activeTab === "text"
              ? "text-primary-dark bg-white rounded-xl shadow-sm"
              : "text-gray-400 bg-transparent hover:text-gray-600 hover:bg-white/50"
          }`}
          onClick={() => handleTabChange("text")}
          aria-label="Text tab"
          aria-pressed={activeTab === "text"}
        >
          <HiOutlineMenuAlt2 />
        </button>
        <button
          className={`flex-1 sm:flex-none w-full py-4 sm:py-5 flex items-center justify-center text-2xl sm:text-[1.6rem] border-none cursor-pointer transition-all duration-200 ${
            activeTab === "file"
              ? "text-primary-dark bg-white rounded-xl shadow-sm"
              : "text-gray-400 bg-transparent hover:text-gray-600 hover:bg-white/50"
          }`}
          onClick={() => handleTabChange("file")}
          aria-label="File tab"
          aria-pressed={activeTab === "file"}
        >
          <PiFilesFill />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-[260px] sm:min-h-[350px] md:min-h-[400px] p-4 sm:p-6 md:p-7 lg:p-8">
        {activeTab === "text" ? (
          <TextPanel user={user} onShareText={onShareText} onDataLoaded={onDataLoaded} />
        ) : (
          <FilePanel user={user} onShareFiles={onShareFiles} onDataLoaded={onDataLoaded} />
        )}
      </div>
    </div>
  );
};

export default Sidebar;
