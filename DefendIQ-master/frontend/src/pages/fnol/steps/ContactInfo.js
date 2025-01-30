import React, { useState, useEffect } from 'react';

const ContactInfo = ({ handleChange, claimData, isValid }) => {
  useEffect(() => {
    const isFormValid = 
      claimData.contact_name &&
      claimData.contact_phone_number &&
      claimData.contact_email &&
      claimData.contact_address &&
      claimData.contact_pincode;
      

    isValid(isFormValid); // Pass validation status to the parent component
  }, [claimData, isValid]);
  return (
    <div>
      <h3>Contact Information</h3>
      <label>Contact Name</label>
      <input name="contact_name" value={claimData.contact_name} placeholder="Name" onChange={handleChange} />
      <label>Contact Phone</label>
      <input name="contact_phone_number" value={claimData.contact_phone_number} placeholder="Phone Number" onChange={handleChange} />
      <label>Contact Email</label>
      <input name="contact_email" value={claimData.contact_email} placeholder="Email" onChange={handleChange} />
      <label>Contact Address</label>
      <input name="contact_address" value={claimData.contact_address} placeholder="Address" onChange={handleChange} />
      <label>Contact Pincode</label>
      <input name="contact_pincode" value={claimData.contact_pincode} placeholder="Pincode" onChange={handleChange} />
    </div>
  );
};

export default ContactInfo;
