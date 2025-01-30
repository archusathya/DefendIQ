import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './ClaimInformation.css';



const ClaimInformation = () => {
  const { claimNumber } = useParams();
  const [claimDetails, setClaimDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [incident, setIncidentData] = useState([]);

  useEffect(() => {
    const fetchClaimDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/claims/${claimNumber}`);
        setClaimDetails(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchClaimDetails();
  }, [claimNumber]);

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


  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="claim-info-container">
      <div className="claim-info-content">
      <h2>Claim information</h2>
      {claimDetails || incident ? (
         <div className="claim-info-details">
          {/* <p><strong>Claim Number:</strong> {claimNumber}</p> */}
          <p><strong>Policy Number:</strong> <Link to={`/PolicyDetails/${claimDetails.PolicyNumber}/view-policyInfo`} class="link">{claimDetails.PolicyNumber}</Link></p>
          <p><strong>Incident Date:</strong> {new Date(incident.IncidentDate).toLocaleString()}</p>
          <p><strong>Incident Description:</strong> {incident.IncidentDescription}</p>
          <p><strong>Incident Location:</strong> {incident.IncidentLocation}</p>
          <p><strong>Reported By:</strong> {claimDetails.Claimant}</p>
          <p><strong>Reported Via:</strong> {claimDetails.ReportedVia}</p>
          <p><strong>Status:</strong> {claimDetails.Status}</p>

          {/* Add more fields as necessary */}
        </div>
      ) : (
        <p>No claim information found.</p>
      )}
    </div>
    </div>
  );
};

export default ClaimInformation;