import React from 'react';
import { Link, Outlet, useParams } from 'react-router-dom';
import '../../styles.css'; // Importing the CSS for layout styling
import Sidebar from '../../component/Sidebar';
import LoggedInUser from '../../component/LoginUser';

const Layout = () => {
  const { claimNumber } = useParams();
  const sessionUser = sessionStorage.getItem('username');
  
  return (
    <div>
        <main>
            <div class="top-menu">
                <div className="claim-number">
                    Claim Number: <span>{claimNumber}</span>
                </div>
            <ul>
                <li><i class="material-icons">description</i> <Link to={`/ClaimDetails/${claimNumber}/view-claimInfo`} class="link">Claim Information</Link></li>
                {/* <li><i class="material-icons">assignment</i><Link to={`/ClaimDetails/${claimNumber}/loss-details`} class="link">Loss Details</Link></li> */}
                <li><i class="material-icons">assessment</i><Link to={`/ClaimDetails/${claimNumber}/assessment`} class="link">Assessment</Link></li>
                <li><i class="material-icons">monetization_on</i> <Link to={`/ClaimDetails/${claimNumber}/reserves`} class="link">Reserves</Link></li>
                <li><i class="material-icons">payment</i> <Link to={`/ClaimDetails/${claimNumber}/payments`} class="link">Payments</Link></li>
                <li><i class="material-icons">history</i> <Link to={`/ClaimDetails/${claimNumber}/history`} class="link">History</Link></li>
                <li><i class="material-icons">contacts</i> <Link to={`/ClaimDetails/${claimNumber}/contacts`} class="link">Contacts</Link></li>
                <li><i class="material-icons">security</i> <Link to={`/ClaimDetails/${claimNumber}/fraud-claims`} class="link">Fraud</Link></li>
                <li><i class="material-icons">description</i> <Link to={`/ClaimDetails/${claimNumber}/assign-claim`} class="link">Assign Claim</Link></li>
                <li><i class="material-icons">exit_to_app</i> <Link to={`/ClaimDetails/${claimNumber}/close-claim`} class="link">Close Claim</Link></li>
            </ul>
            </div>

            <section class="claim-details">
                <Outlet/>
            </section>

        </main>
    </div>
  );
};

export default Layout;
