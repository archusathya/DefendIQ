import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../component/Sidebar';
import LoggedInUser from '../../component/LoginUser';

const UserAdministration = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/users');
        console.log('Fetched users:', response.data); // Debugging statement
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="policy-information-container">
      <div className="policy-content">
        <h1>User Administration</h1>
        <Link to="/register">
          <button>Register new user</button>
        </Link>
        <table class="claims-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Name</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="2">No users found</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.UserId}>
                  {/* <td>{user.UserId}</td> */}
                  <td>
                    <Link to={`/user/${user.UserId}`} className="claim-link">{user.Username}</Link>
                  </td>
                  <td>{user.FirstName} {user.LastName}</td>
                  <td>{user.Email}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
    </div>
  );
};

export default UserAdministration;