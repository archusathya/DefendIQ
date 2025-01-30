import React from 'react';
import './LoginUser.css'; // Importing the CSS for styling

const LoggedInUser = () => {
  const sessionUser = sessionStorage.getItem('username'); // Fallback to 'Guest' if no user is logged in
  return (
    <div className="loggedUser">
      <ul>
        <li>
          <i className="material-icons">person</i> {sessionUser}
        </li>
      </ul>
    </div>
  );
};

export default LoggedInUser;
