import React, { useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const AssignmentTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [searchError, setSearchError] = useState(null);
  const [assignSuccessMsg, setAssignSuccessMsg] = useState(null);
  const { claimNumber } = useParams();
  const handleSearch = async () => {
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(searchTerm)) {
        setSearchError('Invalid email address');
      } else {
        setSearchError('');
        const response = await axios.get(`http://localhost:5000/api/search-users?query=${searchTerm}`);
        const users = (response.data.users || []).map((userArray) => ({
          UserId: userArray[0],
          Username: userArray[1],
          FirstName: userArray[2],
          LastName: userArray[3],
          Email: userArray[4],
        }));
        setUserResults(users);
      }
    } catch (error) {
      console.error("Error searching users", error);
      setSearchError(error.response.data.message);
    }
  };

  const handleAssignClaim = async (userId, firstName, lastName) => {
    try {
      await axios.post(`http://localhost:5000/api/assign-claim`, {
        claimNumber,
        userId,
      });
      setAssignSuccessMsg(`Claim successfully assigned to ${firstName} ${lastName}`);
    } catch (error) {
      console.error("Error assigning claim", error);
      setSearchError("Failed to assign claim");
    }
  };

  return (
    <div>
      <div>Enter the email ID of the user to which you want to assign this claim</div>
      <div className="user-search">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for a user"
        />
        <button onClick={handleSearch}>Search</button>
        {searchError && <p style={{ color: 'red' }}>{searchError}</p>}
      </div>
      {userResults.length > 0 && (
        <div className="user-results">
          <h4>Search Results:</h4>
          <ul>
            {userResults.map((user) => (
              <li key={user.UserId}>
                {user.FirstName} {user.LastName} ({user.Email})
                <button className="assign-btn" onClick={() => handleAssignClaim(user.UserId, user.FirstName, user.LastName)}> Assign</button>
              </li>
            ))}
          </ul>
          {assignSuccessMsg && <p style={{ color: 'green' }}>{assignSuccessMsg}</p>}
        </div>
      )}
    </div>
  );
};

export default AssignmentTab;
