import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../component/Sidebar';
import LoggedInUser from '../../component/LoginUser';
import "./UserDetails.css"

const UserDetails = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/users/${userId}`);
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    fetchUserDetails();
  }, [userId]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="UserDetails-container">
    <Sidebar />
    <LoggedInUser/>
      <div className="UserDetails-content">
      <h2>User Details</h2>
      <div className="UserDetails-details">
      {/* <p><strong>UserId:</strong> {user.UserId}</p> */}
      <p><strong>Username:</strong> {user.Username}</p>
      <p><strong>FirstName:</strong> {user.FirstName}</p>
      <p><strong>LastName:</strong> {user.LastName}</p>
      <p><strong>Email:</strong> {user.Email}</p>
      {/* <p><strong>Security Question:</strong> {user.SecurityQuestion}</p>
      <p><strong>SecurityAnswer:</strong> {user.SecurityAnswer}</p> */}
      </div>
    </div>
    </div>
  );
};

export default UserDetails;