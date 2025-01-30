import React from 'react';
import Header from './Header';
import Footer from './Footer';

const Layout = ({ children }) => {
  const footerLinks = [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <div>
      <Header title="DefendIQ" links={footerLinks} />
      {children} {/* Render page-specific content here */}
      <Footer/>
    </div>
  );
};

export default Layout;
