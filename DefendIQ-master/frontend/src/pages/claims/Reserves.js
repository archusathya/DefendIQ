import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import './Reserves.css';

const Reserves = () => {
  const { claimNumber } = useParams();
  const [reserves, setReserves] = useState([]);
  const [newReserveAmount, setNewReserveAmount] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [errorMessage, setError] = useState(null);
  const [successMessage, setSuccess] = useState(null);

  const fetchReserves = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/reserves/${claimNumber}`);
      setReserves(response.data); // Assume response.data is an array
      setError(null); // Clear any existing errors
    } catch (error) {
      console.error('Error fetching reserves:', error);
      setError(error.message); // Set the error message
    }
  };

  useEffect(() => {
    fetchReserves();
  }, [claimNumber]);

  const handleInputChange = (e) => {
    setNewReserveAmount(e.target.value);
  };

  const handleCancel = () => {
    setSuccess('');
    setError('');
    setShowForm(false);
  };

  const handleUpdate = () => {
    setSuccess('');
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSuccess('');
      setError('');
      const response = await axios.post('http://localhost:5000/api/update_reserve', {
        new_reserve_amount: newReserveAmount,
        claim_number: claimNumber,
      });

      setSuccess(response.data.message);

      // Refresh the reserves list from the server
      fetchReserves();

      setNewReserveAmount('');
      setShowForm(false);
    } catch (error) {
      setError(error.response?.data?.error || 'An error occurred'); // Set the error message
    }
  };

  return (
    <div className="reserves-container">
      {reserves.length > 0 ? (
        reserves.map(reserve => (
          <div key={reserve.ReserveID} className="reserve-details">
            <div className="reserve-field">
              <strong>Reserve Amount:</strong> {reserve.ReserveAmount}
            </div>
            <div className="reserve-field">
              <strong>Coverage Code:</strong> {reserve.CoverageCode}
            </div>
            <div className="reserve-field">
              <strong>Claim Number:</strong> {reserve.ClaimNumber}
            </div>
          </div>
        ))
      ) : (
        <p>No reserve data available.</p>
      )}
      <button onClick={handleUpdate}>Update reserve amount</button>
      {showForm && (
        <form onSubmit={handleSubmit}>
          <label>
            New Reserve Amount:
            <input
              type="number"
              value={newReserveAmount}
              onChange={handleInputChange}
              required
            />
          </label>
          <button type="submit">Submit</button>
          <button type="button" onClick={handleCancel}>Cancel</button>
        </form>
      )}
      {successMessage && <p className="update-success">{successMessage}</p>}
      {errorMessage && <p className="update-error">{errorMessage}</p>}
    </div>
  );
};

export default Reserves;
