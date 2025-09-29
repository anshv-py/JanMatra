'use client';


import { useAuth } from '@/components/providers';
import { LandingPage } from '@/components/landing-page';
import DashboardLayout from '@/components/dashboard-layout';

export default function Home() {
  const { user } = useAuth();
  
  if (user) {
    return <DashboardLayout />;
  }
  
  return <LandingPage />;
}