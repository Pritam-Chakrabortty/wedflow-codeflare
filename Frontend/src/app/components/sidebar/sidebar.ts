import { Component, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  private auth = inject(Auth);
  private router = inject(Router);

  isMobileOpen = false;

  closeMobileSidebar() {
    this.isMobileOpen = false;
  }

  currentUser = computed(() => this.auth.getUser());

  userName = computed(() => {
    const user = this.currentUser();
    if (!user) return 'User';
    const staff = user.staffName || user.staff_name;
    if (staff) return staff;
    const first = user.firstName || user.first_name || '';
    const last = user.lastName || user.last_name || '';
    const fullName = `${first} ${last}`.trim();
    if (fullName) return fullName;
    if (user.email) {
      const emailPrefix = user.email.split('@')[0];
      return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    }
    return 'User';
  });

  userRole = computed(() => {
    const role = this.currentUser()?.role;
    if (!role) return 'User';
    if (role.toLowerCase() === 'admin') return 'Administrator';
    return role.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  });

  userInitial = computed(() => {
    const name = this.userName();
    return name ? name.charAt(0).toUpperCase() : 'U';
  });

  logout(): void {
    this.auth.clearSession();
    this.router.navigate(['/login']);
  }
}
