import React, { useEffect } from 'react';

const ClaimInfo = ({ handleChange, claimData, handleFileChange, isValid }) => {
  // Validate the fields inside useEffect
  useEffect(() => {
    const isFormValid = 
      claimData.incident_discovery_date &&
      claimData.reported_by &&
      claimData.reported_via &&
      claimData.attachments
      //claimData.claimant;

    isValid(isFormValid); // Pass validation status to the parent component
  }, [claimData, isValid]);

  return (
    <div className="container">
      <h3>Claim Information</h3>

      <label>Incident Discovery Date</label>
      <input
        name="incident_discovery_date"
        type="datetime-local"
        value={claimData.incident_discovery_date}
        onChange={handleChange}
        required
      />

      <label>Reported By</label>
      <input
        name="reported_by"
        value={claimData.reported_by}
        placeholder="Reported By"
        onChange={handleChange}
        required
      />

      <label>Reported Via</label>
      <select
        name="reported_via"
        value={claimData.reported_via}
        onChange={handleChange}
        required
      >
        <option value="">Select an option</option>
        <option value="Email">Email</option>
        <option value="Message">Message</option>
        <option value="Phone call">Phone call</option>
        <option value="In-person">In-person</option>
      </select>

      <label>Attachments</label>
      <input
        type="file"
        name="attachments"
        onChange={handleFileChange}
        multiple
        required
      />
    </div>
  );
};

export default ClaimInfo;