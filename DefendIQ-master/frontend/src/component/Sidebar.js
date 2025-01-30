import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './../component/AuthContext';

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const sessionUser = sessionStorage.getItem('username');
  const handleLogout = (event) => {
    event.preventDefault(); // Prevents the default behavior of the <Link> tag
    logout();
    sessionStorage.removeItem('username');
    navigate('/'); // Redirects to the login or home page after logout
  };
  return (
    <nav className="sidebar">
      <ul>
        <li><i className="material-icons">home</i> <Link to="/home">Home</Link></li>
        <li><i className="material-icons">list_alt</i><Link to="/claims">My Claims</Link></li>
        <li><i className="material-icons">note_add</i><Link to="/createClaim">File a claim</Link></li>
        <li><i className="material-icons">manage_accounts</i> <Link to="/usersadmin">Administration</Link></li>
        <li>
          <i className="material-icons">logout</i>
          <Link to="/" onClick={handleLogout}>Logout</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;