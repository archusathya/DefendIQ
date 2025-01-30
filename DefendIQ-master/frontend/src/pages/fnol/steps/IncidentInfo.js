import React, { useEffect, useState } from 'react';
import axios from 'axios';

const IncidentInfo = ({ handleChange, claimData, isValid, policyNumber }) => {
  const [incidents, setIncidents] = useState({});
  const [subtypes, setSubtypes] = useState([]);
  const [faultRatings, setFaultRatings] = useState([]);

  // Fetch incident types and subtypes from the Flask API
  useEffect(() => {
    fetch(`http://localhost:5000/api/policy_incidents/${claimData.policy_number}`)
      .then(response => response.json())
      .then(data => setIncidents(data));
  }, []);

  // Fetch fault ratings from the database via API
  useEffect(() => {
    fetch('http://localhost:5000/api/fault-ratings')
      .then(response => response.json())
      .then(data => setFaultRatings(data));
  }, []);

  // Handle the selection of an IncidentType
  const handleTypeChange = (e) => {
    const typeId = e.target.value;
    handleChange({ target: { name: 'incident_type_id', value: typeId } });

    // Update the subtypes for the selected type
    if (incidents[typeId]) {
      setSubtypes(incidents[typeId].IncidentSubTypes || []);
    } else {
      setSubtypes([]);
    }
  };

  // Validate fields
  useEffect(() => {
    const isFormValid = 
      claimData.incident_description &&
      claimData.incident_location &&
      claimData.incident_type_id &&
      claimData.incident_subtype_id &&
      claimData.fault_rating;

    isValid(isFormValid); // Pass validation status to the parent component
  }, [claimData, isValid]);

  return (
    <div>
      <h3>Enter the incident information below</h3>

      <label>Incident Description</label>
      <textarea
        name="incident_description"
        value={claimData.incident_description}
        placeholder="Incident Description"
        onChange={handleChange}
        required
      />

      <label>Incident Location</label>
      <input
        name="incident_location"
        value={claimData.incident_location}
        placeholder="Incident Location"
        onChange={handleChange}
        required
      />

      {/* Dropdown for Incident Types */}
      <label>Incident Type</label>
      <select
        name="incident_type_id"
        value={claimData.incident_type_id}
        onChange={handleTypeChange}
        required
      >
        <option value="">Select Incident Type</option>
        {Object.keys(incidents).map((typeId) => (
          <option key={typeId} value={typeId}>
            {incidents[typeId].IncidentType}
          </option>
        ))}
      </select>

      {/* Dropdown for Incident SubTypes */}
      <label>Incident Subtype</label>
      <select
        name="incident_subtype_id"
        value={claimData.incident_subtype_id}
        onChange={handleChange}
        required
      >
        <option value="">Select Incident SubType</option>
        {subtypes.map((subtype) => (
          <option key={subtype.IncidentSubTypeID} value={subtype.IncidentSubTypeID}>
            {subtype.IncidentSubType}
          </option>
        ))}
      </select>

      {/* Dropdown for Fault Rating */}
      <label>Fault Rating</label>
      <select
        name="fault_rating"
        value={claimData.fault_rating}
        onChange={handleChange}
        required
      >
        <option value="">Select Fault Rating</option>
        {faultRatings.map((rating) => (
          <option key={rating.id} value={rating.id}>
            {rating.label}
          </option>
        ))}
      </select>
      
    </div>
  );
};

export default IncidentInfo;
