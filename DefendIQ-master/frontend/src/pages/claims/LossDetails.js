import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import './LossDetails.css';

const LossDetails = () => {
  const [incident, setIncidentData] = useState([]);
  const { claimNumber } = useParams(); // Extract claimNumber from URL parameters

  useEffect(() => {
    const fetchIncidentData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/incidents/${claimNumber}`); // Adjust the URL as necessary
        setIncidentData(response.data);
      } catch (error) {
        console.error('Error fetching incident data:', error);
      }
    };

    fetchIncidentData();
  }, [claimNumber]); // Dependency array includes claimNumber

  return (
    <div className="loss-details-container">
      <div className="loss-details-content">
        <h2>Loss Details</h2>
        {incident ? (
            <div key={incident.IncidentID} className="incident-details">
              <div className="incident-field">
                <strong>Incident ID:</strong> {incident.IncidentID}
              </div>
              <div className="incident-field">
                <strong>Description:</strong> {incident.IncidentDescription}
              </div>
              <div className="incident-field">
                <strong>Location:</strong> {incident.IncidentLocation}
              </div>
              <div className="incident-field">
                <strong>Date:</strong> {new Date(incident.IncidentDate).toLocaleString()}
              </div>
              {/* <div className="incident-field">
                <strong>Type ID:</strong> {incident.IncidentTypeID}
              </div> */}
              {/* <div className="incident-field">
                <strong>Impact Description:</strong> {incident.ImpactDescription}
              </div> */}
              {/* <div className="incident-field">
                <strong>Subtype ID:</strong> {incident.IncidentSubtypeID}
              </div> */}
              {/* <div className="incident-field">
                <strong>Claim Number:</strong> {incident.ClaimNumber}
              </div> */}
            </div>
          ) : (
            <p>No claim details found.</p>
          )}
      </div>
  </div>
  );
};

export default LossDetails;