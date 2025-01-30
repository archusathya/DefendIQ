import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import './Claims.css'; 
import Sidebar from '../../component/Sidebar';
import LoggedInUser from '../../component/LoginUser';
import Header from '../../component/Header';

const Claims = () => {
    const [claims, setClaims] = useState([]);
    const navigate = useNavigate();
    const sessionUser = sessionStorage.getItem('username');
    const headerLinks = [
        { label: 'Home', href: '/' },
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ];

    // Function to fetch claims data from the backend
    const fetchClaims = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/claims?sessionUser=${sessionUser}`);
            setClaims(response.data);
        } catch (error) {
            console.error("There was an error fetching the claims!", error);
        }
    };

    // Fetch claims when the component mounts
    useEffect(() => {
        fetchClaims();
    }, []);

    return (
        <div className="claimdetails-container">
            <main className="main-content">
                <h1 className="page-title">My Claims</h1>
                <table className="claims-table">
                    <thead>
                        <tr>
                            <th>Claim Number</th>
                            <th>Policy Number</th>
                            <th>Incident Date</th>
                            {/* <th>Reported By</th>
                            <th>Reported Via</th> */}
                            <th>Status</th>
                            <th>Assign to</th>
                        </tr>
                    </thead>
                    <tbody>
                        {claims.map((claim) => (
                            <tr key={claim.ClaimNumber}>
                                <td>
                                    <Link to={`/ClaimDetails/${claim.ClaimNumber}/view-claimInfo`} className="claims-link">
                                        {claim.ClaimNumber}
                                    </Link>
                                </td>
                                <td><Link to={`/PolicyDetails/${claim.PolicyNumber}/view-policyInfo`}className="claims-link">{claim.PolicyNumber}</Link></td>
                                <td>{new Date(claim.IncidentDiscoveryDate).toLocaleDateString()}</td>
                                {/* <td>{claim.Claimant}</td>
                                <td>{claim.ReportedVia}</td> */}
                                <td>{claim.Status}</td>
                                <td>{claim.Username}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </main>
        </div>
    );
};

export default Claims;
