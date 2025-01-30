import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './CreateContact.css';

const CreateContact = () => {
  const { claimNumber } = useParams(); // Extract claimNumber from URL parameters
  const navigate = useNavigate();
  const sessionUser = sessionStorage.getItem('username');
  const [newContact, setNewContact] = useState({
    Name: '',
    PhoneNumber: '',
    Email: '',
    Address: '',
    PinCode: '',
    ClaimNumber: claimNumber,
    sessionUser: sessionUser
  });
  const [errorMessage, setErrorMessage] = useState('');

  // Function to handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewContact({ ...newContact, [name]: value });
  };

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/contacts', newContact);
      navigate(-1); // Navigate back to the previous page after successful submission
    } catch (error) {
      if (error.response && error.response.status === 409) {
        setErrorMessage('Contact already exists in the database.');
      } else {
        console.error('There was an error creating the contact!', error);
      }
    }
  };

  // Function to handle back button click
  const handleBackClick = () => {
    navigate(-1); // Navigate back to the previous page
  };

  return (
    <div className="create-contact-container">
      <div className="create-contacts-content">
      <h3>Create a new contact</h3>
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      <form onSubmit={handleSubmit}>
      <label>
            Name
            </label>
            <input
              type="text"
              name="Name"
              placeholder="Name"
              value={newContact.Name}
              onChange={handleInputChange}
              required
            />
          
          <label>
            Phone Number
            </label>
            <input
              type="text"
              name="PhoneNumber"
              placeholder="Phone Number"
              value={newContact.PhoneNumber}
              onChange={handleInputChange}
              required
            />
         
          <label>
            Email
            </label>
            <input
              type="email"
              name="Email"
              placeholder="Email"
              value={newContact.Email}
              onChange={handleInputChange}
              required
            />
          
          <label>
            Address
            </label>
            <input
              type="text"
              name="Address"
              placeholder="Address"
              value={newContact.Address}
              onChange={handleInputChange}
              required
            />
          
          <label>
            Pin Code
            </label>
            <input
              type="text"
              name="PinCode"
              placeholder="Pin Code"
              value={newContact.PinCode}
              onChange={handleInputChange}
              required
            />
          <button onClick={handleBackClick}>Back</button>
          <button type="submit">Submit</button>
        </form>
      </div>
    </div>
  );
};

export default CreateContact;