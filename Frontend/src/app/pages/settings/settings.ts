import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudioBranding } from './studio-branding/studio-branding';
import { AutomationRules } from './automation-rules/automation-rules';
import { EmailStudio } from './email-studio/email-studio';
import { Auth } from '../../services/auth';
import { environment } from '../../../environments/environment';

interface SettingsCard {
  key: string;
  icon: 'branding' | 'automation' | 'email' | 'whatsapp';
  title: string;
  description: string;
  badgeLabel: string;
  disabled?: boolean;
}

interface WorkspaceSettings {
  id: string;
  companyName: string;
  notificationMode: 'email' | 'whatsapp' | 'both';
  logoUrl: string | null;
  crewAssignmentDays: number;
  whatsappEnabled: boolean;
  emailFormatsCount: number;
  timezone: string;
  currency: string;
  status: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, StudioBranding, AutomationRules, EmailStudio],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings implements OnInit {
  studioName = signal('DRV Studios');
  studioLogoUrl = signal<string | null>('/assests/images/drv.jpg');
  crewAssignmentDays = signal(10);
  notificationMode = signal<'email' | 'whatsapp' | 'both'>('email');
  whatsappEnabled = signal(false);
  emailFormatsCount = signal(16);
  isLoading = signal(true);
  error = signal<string | null>(null);

  activeView: 'branding' | 'automation' | 'email' | null = null;

  cards = signal<SettingsCard[]>([
    {
      key: 'branding',
      icon: 'branding',
      title: 'Studio Branding',
      description: 'Update the company logo used throughout the portal and notifications.',
      badgeLabel: 'Logo configured',
    },
    {
      key: 'automation',
      icon: 'automation',
      title: 'Automation Rules',
      description: 'Set operational lead times for crew assignment.',
      badgeLabel: '10 days before event',
    },
    {
      key: 'email',
      icon: 'email',
      title: 'Email Studio',
      description: 'Edit one premium email format at a time with its own banner.',
      badgeLabel: '16 formats',
    },
    {
      key: 'whatsapp',
      icon: 'whatsapp',
      title: 'WhatsApp Studio',
      description: 'Enable WhatsApp for this company from Superadmin first.',
      badgeLabel: 'Not enabled',
      disabled: true,
    },
  ]);

  constructor(private auth: Auth) {}

  ngOnInit(): void {
    this.loadWorkspaceSettings();
  }

  async loadWorkspaceSettings(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      const token = this.auth.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${environment.apiUrl}/workspace/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load workspace settings');
      }

      const data: WorkspaceSettings = await response.json();
      
      this.studioName.set(data.companyName);
      this.studioLogoUrl.set(data.logoUrl);
      this.crewAssignmentDays.set(data.crewAssignmentDays);
      this.notificationMode.set(data.notificationMode);
      this.whatsappEnabled.set(data.whatsappEnabled);
      this.emailFormatsCount.set(data.emailFormatsCount);

      this.updateCardsWithRealData(data);
    } catch (error) {
      console.error('Error loading workspace settings:', error);
      this.error.set('Failed to load workspace settings');
    } finally {
      this.isLoading.set(false);
    }
  }

  private updateCardsWithRealData(data: WorkspaceSettings): void {
    this.cards.set([
      {
        key: 'branding',
        icon: 'branding',
        title: 'Studio Branding',
        description: 'Update the company logo used throughout the portal and notifications.',
        badgeLabel: data.logoUrl ? 'Logo configured' : 'Not configured',
      },
      {
        key: 'automation',
        icon: 'automation',
        title: 'Automation Rules',
        description: 'Set operational lead times for crew assignment.',
        badgeLabel: `${data.crewAssignmentDays} days before event`,
      },
      {
        key: 'email',
        icon: 'email',
        title: 'Email Studio',
        description: 'Edit one premium email format at a time with its own banner.',
        badgeLabel: `${data.emailFormatsCount} formats`,
      },
      {
        key: 'whatsapp',
        icon: 'whatsapp',
        title: 'WhatsApp Studio',
        description: 'Enable WhatsApp for this company from Superadmin first.',
        badgeLabel: data.whatsappEnabled ? 'Enabled' : 'Not enabled',
        disabled: !data.whatsappEnabled,
      },
    ]);
  }

  onCardClick(card: SettingsCard): void {
    if (card.disabled) return;
    if (card.key === 'branding' || card.key === 'automation' || card.key === 'email') {
      this.activeView = card.key;
    }
  }

  onBackToGrid(): void {
    this.activeView = null;
  }

  async onBrandingSaved(newLogoUrl: string | null): Promise<void> {
    try {
      const token = this.auth.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${environment.apiUrl}/workspace/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logoUrl: newLogoUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to update logo');
      }

      const data: WorkspaceSettings = await response.json();
      this.studioLogoUrl.set(data.logoUrl);
      this.updateCardsWithRealData(data);
      this.activeView = null;
    } catch (error) {
      console.error('Error updating logo:', error);
      alert('Failed to update logo. Please try again.');
    }
  }

  async onAutomationSaved(newDays: number): Promise<void> {
    try {
      const token = this.auth.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${environment.apiUrl}/workspace/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ crewAssignmentDays: newDays }),
      });

      if (!response.ok) {
        throw new Error('Failed to update automation rules');
      }

      const data: WorkspaceSettings = await response.json();
      this.crewAssignmentDays.set(data.crewAssignmentDays);
      this.updateCardsWithRealData(data);
      this.activeView = null;
    } catch (error) {
      console.error('Error updating automation rules:', error);
      alert('Failed to update automation rules. Please try again.');
      // Keep the view open so user can try again
    }
  }

  onEmailStudioSaved(): void {
    this.activeView = null;
  }

  getNotificationModeText(): string {
    const mode = this.notificationMode();
    switch (mode) {
      case 'email':
        return 'Email notifications';
      case 'whatsapp':
        return 'WhatsApp notifications';
      case 'both':
        return 'Email & WhatsApp notifications';
      default:
        return 'Email notifications';
    }
  }
}