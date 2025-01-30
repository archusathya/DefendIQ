import React, { useState } from 'react';
import './Tabs.css'; // Import the CSS file for the tabs

const Tabs = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(tabs[0].label);

  const handleTabClick = (label) => {
    setActiveTab(label);
  };

  return (
    <div className="tabs">
      <div className="tab-headers">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            className={`tab-header ${tab.label === activeTab ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.label)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tab-content">
        {tabs.map((tab) => (
          tab.label === activeTab && <div key={tab.label}>{tab.content}</div>
        ))}
      </div>
    </div>
  );
};

export default Tabs;