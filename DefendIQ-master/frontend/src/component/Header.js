import React from 'react';
import './Header.css'; // Optional CSS file for styling
import Image from '../Images/DefendIQ Logo.png';

const Header = ({ title, links }) => {
    const sessionUser = sessionStorage.getItem('username');
  return (
    <header className="header-container">
      <div className="header-title">
        <img src={Image} alt="DefendIQ Logo" className="logo" />
        <h2>{title}</h2>
      </div>
      <nav className="header-nav">
        <ul>
          {/* {links.map((link, index) => (
            <li key={index}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))} */}
          <li>
          <a href='#'>Welcome, {sessionUser}</a> 
        </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
