import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface EmailFormat {
  key: string;
  title: string;
  description: string;
  hasImage?: boolean; // New Booking, User Welcome — image icon dekhay original-e
  subject: string;
  message: string;
}

const PLACEHOLDER_TOKENS = [
  '{{companyName}}',
  '{{clientName}}',
  '{{packageName}}',
  '{{eventDate}}',
  '{{venue}}',
  '{{staffName}}',
  '{{role}}',
  '{{loginUrl}}',
  '{{otp}}',
  '{{totalAmount}}',
  '{{deliverables}}',
  '{{paymentSchedule}}',
];

@Component({
  selector: 'app-email-studio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './email-studio.html',
  styleUrl: './email-studio.scss',
})
export class EmailStudio {
  @Output() back = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  tokens = PLACEHOLDER_TOKENS;
  companyName = 'DRV Studios';
  supportEmail = '';
  bannerUrl: string | null = null;
  isSaving = false;

  // TEMPORARY DUMMY DATA — for UI testing only. Remove once backend confirmed working.
  formats: EmailFormat[] = [
    {
      key: 'login-otp',
      title: 'Login OTP',
      description: 'Secure portal login code.',
      subject: 'Login OTP',
      message:
        'Hello {{name}},\n\nYour login OTP is {{otp}}.\nThis code expires in 10 minutes.\n\nwedflowcrm',
    },
    {
      key: 'new-booking',
      title: 'New Booking',
      description: 'Booking welcome, package and event details.',
      hasImage: true,
      subject: 'Your booking with {{companyName}} is confirmed',
      message:
        'Hello {{clientName}},\n\nThank you for booking {{packageName}} for {{eventDate}} at {{venue}}.\n\nWe look forward to working with you.\n\n{{companyName}}',
    },
    {
      key: 'booking-update',
      title: 'Booking Update',
      description: 'Package, venue or booking changes.',
      subject: 'Your booking details have been updated',
      message:
        'Dear {{clientName}},\n\nYour booking details have been updated.\nPackage: {{packageName}}\nEvent date: {{eventDate}}\nVenue: {{venue}}\nTotal amount: Rs. {{totalAmount}}\n\nIncluded deliverables:\n{{deliverables}}\n\nPayment schedule:\n{{paymentSchedule}}\n\nThank you',
    },
    {
      key: 'quote',
      title: 'Quote',
      description: 'Quote before booking confirmation.',
      subject: 'Your quote from {{companyName}}',
      message:
        'Hello {{clientName}},\n\nPlease find your quote for {{packageName}} attached. Let us know if you have any questions.\n\n{{companyName}}',
    },
    {
      key: 'invoice-payment',
      title: 'Invoice / Payment',
      description: 'Payment confirmation and invoice update.',
      subject: 'Payment received — invoice update',
      message:
        'Hello {{clientName}},\n\nWe have received your payment. Your updated invoice is attached.\n\n{{companyName}}',
    },
    {
      key: 'payment-due',
      title: 'Payment Due',
      description: 'Due payment reminder.',
      subject: 'Payment reminder for your upcoming event',
      message:
        'Hello {{clientName}},\n\nThis is a reminder that a payment is due for your event on {{eventDate}}.\n\n{{companyName}}',
    },
    {
      key: 'crew-assignment',
      title: 'Crew Assignment',
      description: 'Assignment details for a team member.',
      subject: "You've been assigned to an event",
      message:
        'Hello {{staffName}},\n\nYou have been assigned as {{role}} for the event on {{eventDate}} at {{venue}}.\n\n{{companyName}}',
    },
    {
      key: 'crew-update',
      title: 'Crew Update',
      description: 'Customer update after crew assignment.',
      subject: 'Your crew has been assigned',
      message:
        'Hello {{clientName}},\n\nWe have assigned our team for your event on {{eventDate}}.\n\n{{companyName}}',
    },
    {
      key: 'crew-details',
      title: 'Crew Details',
      description: 'Event-day crew details for the customer.',
      subject: 'Your event-day crew details',
      message:
        'Hello {{clientName}},\n\nHere are the crew details for your event at {{venue}} on {{eventDate}}.\n\n{{companyName}}',
    },
    {
      key: 'event-reminder',
      title: 'Event Reminder',
      description: 'Reminder before the selected event date.',
      subject: 'Your event is coming up',
      message:
        'Hello {{clientName}},\n\nThis is a reminder that your event at {{venue}} is scheduled for {{eventDate}}.\n\n{{companyName}}',
    },
    {
      key: 'production-deadline',
      title: 'Production Deadline',
      description: 'Editor and production deadline alert.',
      subject: 'Production deadline approaching',
      message:
        'Hello {{staffName}},\n\nThis is a reminder about the upcoming production deadline for {{packageName}}.\n\n{{companyName}}',
    },
    {
      key: 'user-welcome',
      title: 'User Welcome',
      description: 'New staff account and login instructions.',
      hasImage: true,
      subject: 'Welcome to {{companyName}}',
      message:
        'Hello {{staffName}},\n\nYour account has been created. Log in here: {{loginUrl}}\n\n{{companyName}}',
    },
    {
      key: 'marketplace-request',
      title: 'Marketplace Request',
      description: 'Work brief for a freelancer or team.',
      subject: 'New work request from {{companyName}}',
      message:
        'Hello,\n\nYou have received a new work request for {{eventDate}} at {{venue}}.\n\n{{companyName}}',
    },
    {
      key: 'marketplace-response',
      title: 'Marketplace Response',
      description: 'Freelancer acceptance or decline.',
      subject: 'Response to your marketplace request',
      message:
        'Hello,\n\nYour marketplace request has received a response. Please check the portal for details.\n\n{{companyName}}',
    },
    {
      key: 'freelancer-verification',
      title: 'Freelancer Verification',
      description: 'Marketplace onboarding decision.',
      subject: 'Your freelancer verification status',
      message:
        'Hello,\n\nYour marketplace onboarding application has been reviewed. Please check the portal for details.\n\n{{companyName}}',
    },
    {
      key: 'project-file-delivery',
      title: 'Project File Delivery',
      description: 'Raw, preview, edited or final file delivery.',
      subject: 'Your files are ready',
      message:
        'Hello {{clientName}},\n\nYour files for {{packageName}} are ready. Please check the portal to download them.\n\n{{companyName}}',
    },
  ];

  selectedKey = this.formats[0].key;

  get selectedFormat(): EmailFormat {
    return this.formats.find((f) => f.key === this.selectedKey)!;
  }

  get previewLines(): string[] {
    return this.selectedFormat.message.split('\n');
  }

  selectFormat(key: string): void {
    this.selectedKey = key;
  }

  insertToken(token: string): void {
    this.selectedFormat.message = this.selectedFormat.message + token;
  }

  applyFormat(type: 'bold' | 'italic'): void {
    const wrapSymbol = type === 'bold' ? '**' : '*';
    this.selectedFormat.message = `${this.selectedFormat.message} ${wrapSymbol}text${wrapSymbol}`;
  }

  onBannerSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.bannerUrl = reader.result as string;
    };
    reader.readAsDataURL(file);

    input.value = '';
  }

  onBack(): void {
    this.back.emit();
  }

  onSaveAndBack(): void {
    this.isSaving = true;

    // TODO: real API call once email-template endpoint confirmed — mock success for now
    setTimeout(() => {
      this.isSaving = false;
      this.save.emit();
    }, 500);
  }
}
