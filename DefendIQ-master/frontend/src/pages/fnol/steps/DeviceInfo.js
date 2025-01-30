import React, { useState, useEffect } from 'react';

const DeviceInfo = ({ handleChange, claimData, isValid, policyNumber }) => {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    console.log('Policy Number:', policyNumber); // Debug
    if (policyNumber) {
      fetch(`http://localhost:5000/api/devices/${policyNumber}`)
        .then((response) => response.json())
        .then((data) => {
          console.log('Fetched devices:', data); // Debug response
          setDevices(data);
        })
        .catch((error) => {
          console.error('Error fetching devices:', error);
        });
    }
  }, [policyNumber]);

  const handleDeviceChange = (e) => {
    const selectedDeviceId = e.target.value;
    const selectedDevice = devices.find(
      (device) => String(device.DeviceID) === selectedDeviceId
    );
  
    if (selectedDevice) {
      handleChange({
        device_id: selectedDevice.DeviceID,
        device_type_id: selectedDevice.DeviceType,
        make: selectedDevice.Make,
        model: selectedDevice.Model,
      });
    }
  };
  
   // Validate fields
   useEffect(() => {
    const isFormValid = 
      claimData.device_id &&
      claimData.device_type_id &&
      claimData.make &&
      claimData.model;

    isValid(isFormValid); // Pass validation status to the parent component
  }, [claimData, isValid]);
  
  return (
    <div>
      <h3>Device Information</h3>
      <label>Device ID</label>
      <select
        name="device_id"
        value={claimData.device_id} // Correct field
        onChange={handleDeviceChange}
      >
        <option value="">Select Device</option>
        {devices.map((device) => (
          <option key={device.DeviceID} value={device.DeviceID}>
            {device.DeviceID}
          </option>
        ))}
      </select>
      <label>Device Type</label>
      <input
        name="device_type_id"
        value={claimData.device_type_id || ''}
        placeholder="Enter Device Type"
        onChange={handleChange}
        readOnly
      />
      <label>Device Make</label>
      <input name="make" value={claimData.make} placeholder="Make" onChange={handleChange} readOnly/>
      <label>Device Model</label>
      <input name="model" value={claimData.model} placeholder="Model" onChange={handleChange} readOnly/>
    </div>
  );
};

export default DeviceInfo;
