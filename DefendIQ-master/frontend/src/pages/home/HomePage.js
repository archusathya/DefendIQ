import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './HomePage.css'; // Import the CSS file for styling
import Image from '../../../src/Images/DefendIQ Logo.png'; // Import the logo image
import Sidebar from '../../component/Sidebar';

const HomePage = () => {
  const navigate = useNavigate();

  const navigateToClaims = () => {
    navigate('/claims');
  };

  const navigateToCreateClaim = () => {
    navigate('/create-claim');
  };

  const navigateToContacts = () => {
    navigate('/contacts');
  };

  const navigateToUserProfile = () => {
    navigate('/user-profile');
  };

  const navigateToLogin = () => {
    navigate('/');
  };

  return (
    <div class=".claimdetails-container">
    <main>
        <div className="left-section">
          <h1>Welcome to <span className="highlight">DefendIQ</span></h1>
          <p>Your Trusted Platform for Cybercrime Insurance Claims</p>
          <img src={Image} alt="Cyber Incident Illustration" className="illustration" />
          <p>Access your claims securely, anytime, anywhere.</p>
        </div>
       
    </main>
</div>
  );
};

export default HomePage;