import React from 'react';
import ProfilePage from '../components/ProfilePage';

export default function AdminProfile() {
  return (
    <ProfilePage
      statsTitle="Admin Permissions"
      stats={[
        { label: 'System Config',    value: '✓', color: '#7C3AED' },
        { label: 'Staff Management', value: '✓', color: '#7C3AED' },
        { label: 'SLA Policies',     value: '✓', color: '#7C3AED' },
        { label: 'Email Config',     value: '✓', color: '#7C3AED' },
      ]}
      extraDetails={[
        { label: 'Access Level', value: 'Full system access' },
      ]}
    />
  );
}
