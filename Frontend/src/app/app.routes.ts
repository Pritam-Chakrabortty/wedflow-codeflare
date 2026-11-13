import { Routes } from '@angular/router';
import { LandingPage } from './pages/landing-page/landing-page';
import { Login } from './pages/login/login';
import { VerifyOtp } from './pages/verify-otp/verify-otp';
import { FreelancerLogin } from './pages/freelancer-login/freelancer-login';
import { FreelancerRegister } from './pages/freelancer-register/freelancer-register';
import { Dashboard } from './pages/dashboard/dashboard';
import { DashboardShell } from './pages/dashboard-shell/dashboard-shell';
import { Packages } from './pages/packages/packages';
import { Clients } from './pages/clients/clients';
import { UserManagement } from './pages/user-management/user-management';
import { Bookings } from './pages/bookings/bookings';
import { BookingDetail } from './pages/bookings/booking-detail/booking-detail';
import { CrewAssign } from './pages/crew-assign/crew-assign';
import { Marketplace } from './pages/marketplace/marketplace';
import { Storage } from './pages/storage/storage';
import { Equipment } from './pages/equipment-page/equipment-page';
import { WorkflowBoard } from './pages/workflow-board/workflow-board';
import { Production } from './pages/production/production';
import { Settings } from './pages/settings/settings';

export const routes: Routes = [
  {
    path: '',
    component: LandingPage,
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'verify-otp',
    component: VerifyOtp,
  },
  {
    path: 'freelancerlogin',
    component: FreelancerLogin,
  },
  {
    path: 'freelancer-register',
    component: FreelancerRegister,
  },
  {
    path: '',
    component: DashboardShell,
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'packages', component: Packages },
      { path: 'clients', component: Clients },
      { path: 'users', component: UserManagement },
      { path: 'bookings', component: Bookings },
      { path: 'bookings/:id', component: BookingDetail },
      { path: 'crew-assignments', component: CrewAssign },
      { path: 'marketplace', component: Marketplace },
      { path: 'storage', component: Storage },
      { path: 'equipment', component: Equipment },
      { path: 'workflow-board', component: WorkflowBoard },
      { path: 'production', component: Production },
      { path: 'settings', component: Settings },
    ],
  },
];
