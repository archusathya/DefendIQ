import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import './Contacts.css';

const ContactDetails = () => {
  const [contacts, setContacts] = useState([]);
  const { claimNumber } = useParams(); // Extract claimNumber from URL parameters

  useEffect(() => {
    const fetchContactData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/contacts/${claimNumber}`); // Adjust the URL as necessary
        setContacts(response.data);
      } catch (error) {
        console.error('Error fetching contact data:', error);
      }
    };

    fetchContactData();
  }, [claimNumber]);

  return (
    <div className="contacts-container">
      <Link to={`/ClaimDetails/${claimNumber}/create-contact`}>
        <button>Create a new contact</button>
      </Link>
      <table className="claims-table">
        <thead>
          <tr>
            {/* <th>Contact ID</th> */}
            <th>Name</th>
            <th>Phone Number</th>
            <th>Email</th>
            <th>Address</th>
            <th>Pin Code</th>
            {/* <th>Claim Number</th> */}
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.ContactID}>
              {/* <td>{contact.ContactID}</td> */}
              <td>{contact.Name}</td>
              <td>{contact.PhoneNumber}</td>
              <td>{contact.Email}</td>
              <td>{contact.Address}</td>
              <td>{contact.PinCode}</td>
              {/* <td>{contact.ClaimNumber}</td> */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ContactDetails;