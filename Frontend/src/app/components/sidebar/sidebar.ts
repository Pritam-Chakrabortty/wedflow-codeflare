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
    if (!user) return 'Joyeeta Das';
    if (user.staff_name) return user.staff_name;
    const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return name || user.email || 'Joyeeta Das';
  });

  userRole = computed(() => {
    const role = this.currentUser()?.role;
    if (role === 'admin') return 'Administrator';
    if (role) return role.replace(/_/g, ' ').toUpperCase();
    return 'Administrator';
  });

  userInitial = computed(() => {
    return this.userName().charAt(0).toUpperCase() || 'J';
  });

  logout(): void {
    this.auth.clearSession();
    this.router.navigate(['/login']);
  }
}
