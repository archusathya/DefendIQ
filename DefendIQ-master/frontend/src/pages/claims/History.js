import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import './History.css'; // Assuming you have a CSS file for styling

const History = () => {
  const [historyData, setHistoryData] = useState([]);
  const { claimNumber } = useParams(); // Extract claimNumber from URL parameters

  useEffect(() => {
    const fetchHistoryData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/history/${claimNumber}`); // Adjust the URL as necessary
        setHistoryData(response.data);
      } catch (error) {
        console.error('Error fetching history data:', error);
      }
    };

    fetchHistoryData();
  }, [claimNumber]); // Dependency array includes claimNumber

  return (
    <div className="history-container">
      <div className="history-content">
        <h2>History Details</h2>
        {historyData.length > 0 ? (
          <table className="history-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Date</th>
                <th>Description</th>
                <th>Type</th>
                {/* <th>Claim Number</th> */}
              </tr>
            </thead>
            <tbody>
              {historyData.map((history, index) => (
                <tr key={index}>
                  <td>{history.User}</td>
                  <td>{new Date(history.EventTimestamp).toLocaleString()}</td>
                  <td>{history.Description}</td>
                  <td>{history.Type}</td>
                  {/* <td>{history.ClaimNumber}</td> */}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No history data available.</p>
        )}
      </div>
    </div>
  );
};

export default History;