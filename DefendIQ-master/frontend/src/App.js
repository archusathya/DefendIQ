import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'; // Import the CSS file
import LoginPage from './pages/login/LoginPage';
import ClaimDetails from './pages/claims/ClaimDetails';
import Register from './pages/user/Register';
import HomePage from './pages/home/HomePage';
import Claims from './pages/claims/Claims';
import ClaimInformation from './pages/claims/ClaimInformation';
import PolicyInformation from './pages/policy/PolicyInformation';
import UserAdministration from './pages/user/UserAdmin';
import UserDetails from './pages/user/UserDetails';
import LossDetails from './pages/claims/LossDetails';
import Reserves from './pages/claims/Reserves';
import History from './pages/claims/History';
import Payments from './pages/claims/Payments';
import CreateClaim from './pages/fnol/CreateClaim';
import Contacts from './pages/claims/Contacts';
import CreateContact from './pages/claims/CreateContact';
import Assessment from './pages/claims/Assessments';
import CreatePayment from './pages/claims/CreatePayment';
import FraudClaims from './pages/claims/FraudClaims';
import PrivateRoute from './component/PrivateRoute';
import AssignClaim from './component/AssignmentTab';
import Layout from './component/Layout';
import Sidebar from './component/Sidebar';
import CloseClaim from './pages/claims/CloseClaim';
import AssessmentDetails from "./pages/claims/AssessmentDetails";


const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<LoginPage />} />

      <Route
        path="/*"
        element={
          <Layout>
            <Routes>
              <Route path="register" element={<Register />} />
              <Route path="home" element={<PrivateRoute><HomePage /></PrivateRoute>} />
              <Route path="claims" element={<PrivateRoute><Claims /></PrivateRoute>} />
              <Route path="createClaim" element={<PrivateRoute><CreateClaim /></PrivateRoute>} />
              <Route path="usersadmin" element={<PrivateRoute><UserAdministration /></PrivateRoute>} />
              <Route path="user/:userId" element={<PrivateRoute><UserDetails /></PrivateRoute>} />
              <Route path="ClaimDetails/:claimNumber" element={<PrivateRoute><ClaimDetails /></PrivateRoute>}>
                <Route path="view-claimInfo" element={<ClaimInformation />} />
                <Route path="loss-details" element={<LossDetails />} />
                <Route path="assessment" element={<Assessment />} />
                <Route path="assessment-details" element={<AssessmentDetails />} />
                <Route path="reserves" element={<Reserves />} />
                <Route path="payments" element={<Payments />} />
                <Route path="create-payment" element={<CreatePayment />} />
                <Route path="history" element={<History />} />
                <Route path="contacts" element={<Contacts />} />
                <Route path="create-contact" element={<CreateContact />} />
                <Route path="fraud-claims" element={<FraudClaims />} />
                <Route path="assign-claim" element={<AssignClaim />} />
                <Route path="close-claim" element={<CloseClaim />} />
              </Route>
              <Route path="PolicyDetails/:policyNumber" element={<PrivateRoute><PolicyInformation /></PrivateRoute>}>
                <Route path="view-policyInfo" element={<PolicyInformation />} />
              </Route>
              <Route path="payments/:claimNumber" element={<PrivateRoute><Payments /></PrivateRoute>} />
              <Route path="create_payment/:claimNumber" element={<PrivateRoute><CreatePayment /></PrivateRoute>} />
            </Routes>
            <Sidebar />
          </Layout>
        }
      />
    </Routes>
    
  </Router>
);


export default App;
