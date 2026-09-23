import { Component, viewChild, OnInit, inject, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Sidebar } from '../../components/sidebar/sidebar';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Sidebar],
  templateUrl: './dashboard-shell.html',
  styleUrl: './dashboard-shell.scss',
})
export class DashboardShell implements OnInit {
  private auth = inject(Auth);
  sidebar = viewChild(Sidebar);

  toggleMobileSidebar() {
    const sidebar = this.sidebar();
    if (sidebar) {
      sidebar.isMobileOpen = !sidebar.isMobileOpen;
    }
  }

  isDarkMode = true;

  ngOnInit(): void {
    document.documentElement.classList.toggle('light', !this.isDarkMode);
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    document.documentElement.classList.toggle('light', !this.isDarkMode);
  }

  currentUser = computed(() => this.auth.getUser());

  userInitial = computed(() => {
    const user = this.currentUser();
    if (!user) return 'J';
    const name = user.staff_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
    return name.charAt(0).toUpperCase() || 'J';
  });
}