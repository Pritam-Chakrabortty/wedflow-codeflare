import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  Booking,
  BookingService,
  BookingEvent,
  CrewPlanDay,
  CrewAssignment,
  PaymentSchedule,
  DeliveryItem,
  MediaItem,
    ReminderLog,
} from '../../../services/booking.service';
import { StorageService } from '../../../services/storage.service';

import { CrewTab } from './crew-tab/crew-tab';
import { PaymentsTab } from './payments-tab/payments-tab';
import { DeliveriesTab } from './deliveries-tab/deliveries-tab';
import { NewDeliveryData } from './deliveries-tab/delivery-modal/delivery-modal';
import { NewEventDayData } from './crew-tab/event-day-modal/event-day-modal';
import { NewAssignmentData } from './crew-tab/assign-crew-modal/assign-crew-modal';
import { StudioTrackerTab } from './studio-tracker-tab/studio-tracker-tab';
import { Toast } from '../../../components/toast/toast';
import {
  BookingDetailsModal,
  BookingDetailsFormData,
} from './booking-details-modal/booking-details-modal';
import { MediaTab } from './media-tab/media-tab';
import { NewMediaItemData } from './media-tab/media-item-modal/media-item-modal';
import { RemindersTab } from './reminders-tab/reminders-tab';
import { InvoiceTab } from './invoice-tab/invoice-tab';

interface WorkflowStageDef {
  number: number;
  name: string;
  description: string;
  dbStage: string; // Database stage name
}

const WORKFLOW_STAGES: WorkflowStageDef[] = [
  {
    number: 1,
    name: 'Booking Confirmed',
    description: 'The customer has accepted the booking and the event dates are reserved.',
    dbStage: 'booking',
  },
  {
    number: 2,
    name: 'Advance Received',
    description: 'The booking advance has been received and recorded.',
    dbStage: 'booking',
  },
  {
    number: 3,
    name: 'Contract Signed',
    description: 'The customer and company have completed the booking agreement.',
    dbStage: 'booking',
  },
  {
    number: 4,
    name: 'Planning Stage',
    description:
      'Event schedule, venue, customer requirements, and deliverables are being finalized.',
    dbStage: 'planning',
  },
  {
    number: 5,
    name: 'Crew Assigned',
    description:
      'Photographers, videographers, and other required team members have been assigned.',
    dbStage: 'planning',
  },
  {
    number: 6,
    name: 'Pre-Wedding Scheduled',
    description: 'The optional pre-wedding shoot has been scheduled.',
    dbStage: 'production',
  },
  {
    number: 7,
    name: 'Event Completed',
    description: 'The event-day photography or videography work has been completed.',
    dbStage: 'production',
  },
  {
    number: 8,
    name: 'Data Received',
    description: 'The captured photos and videos have been received and are ready for backup.',
    dbStage: 'post_production',
  },
  {
    number: 9,
    name: 'Editing Assigned',
    description: 'The post-production work has been assigned to the appropriate editor.',
    dbStage: 'post_production',
  },
  {
    number: 10,
    name: 'Editing In Progress',
    description: 'The assigned editor is currently working on the photos or videos.',
    dbStage: 'post_production',
  },
  {
    number: 11,
    name: 'QC Review',
    description: 'The company is checking the edited work before sharing it with the customer.',
    dbStage: 'qc',
  },
  {
    number: 12,
    name: 'Client Review',
    description: 'A preview has been shared with the customer for review and approval.',
    dbStage: 'client_review',
  },
  {
    number: 13,
    name: 'Revision Requested',
    description: 'The customer or quality team has requested changes to the edited work.',
    dbStage: 'revision',
  },
  {
    number: 14,
    name: 'Payment Pending',
    description: 'A remaining customer payment is due before final delivery.',
    dbStage: 'delivery',
  },
  {
    number: 15,
    name: 'Full Payment Received',
    description: 'All payments for this booking have been received.',
    dbStage: 'delivery',
  },
  {
    number: 16,
    name: 'Album Designing',
    description: 'The album layout and design are being prepared.',
    dbStage: 'album',
  },
  {
    number: 17,
    name: 'Album Printing',
    description: 'The approved album has been sent for printing.',
    dbStage: 'album',
  },
  {
    number: 18,
    name: 'Ready For Delivery',
    description: 'All final items are prepared and waiting to be delivered.',
    dbStage: 'delivery',
  },
  {
    number: 19,
    name: 'Delivered',
    description: 'The final photos, videos, album, or other items have been delivered.',
    dbStage: 'delivery',
  },
  {
    number: 20,
    name: 'Completed',
    description: 'All work, payments, and deliveries for this booking are complete.',
    dbStage: 'completed',
  },
  {
    number: 21,
    name: 'Archived',
    description: 'The completed booking has been moved to the archive for future reference.',
    dbStage: 'completed',
  },
];

type TabKey = 'crew' | 'payments' | 'deliveries' | 'tracker' | 'media' | 'reminders' | 'invoice';

@Component({
  selector: 'app-booking-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, CrewTab, PaymentsTab, DeliveriesTab, Toast, StudioTrackerTab, BookingDetailsModal, MediaTab, RemindersTab, InvoiceTab],
  templateUrl: './booking-detail.html',
  styleUrl: './booking-detail.scss',
})
export class BookingDetail implements OnInit {
  booking: Booking | null = null;
  loading = true;
  error = '';

  workflowOpen = false;
  activeTab: TabKey = 'crew';

  workflowStages = WORKFLOW_STAGES;

  toastVisible = false;
  toastTitle = '';
  toastMsg = '';
  toastVariant: 'success' | 'error' = 'success';
  private toastTimeout: any;

  get currentStageNumber(): number {
    const dbStage = this.booking?.current_workflow_stage || 'booking';
    const stage = WORKFLOW_STAGES.find((s) => s.dbStage === dbStage);
    return stage?.number ?? 1;
  }

  get currentStageName(): string {
    const dbStage = this.booking?.current_workflow_stage || 'booking';
    const stage = WORKFLOW_STAGES.find((s) => s.dbStage === dbStage);
    return stage?.name || 'Booking Confirmed';
  }

  get stagePercent(): number {
    const total = WORKFLOW_STAGES.length;
    return Math.round(((this.currentStageNumber - 1) / (total - 1)) * 100);
  }

  stageStatus(stageNumber: number): 'completed' | 'current' | 'upcoming' {
    if (stageNumber < this.currentStageNumber) return 'completed';
    if (stageNumber === this.currentStageNumber) return 'current';
    return 'upcoming';
  }

  getStageHistory(stageName: string): { date: string; by: string } | null {
    return null;
  }

  tabs: { key: TabKey; label: string }[] = [
    { key: 'crew', label: 'Crew' },
    { key: 'payments', label: 'Payments' },
    { key: 'deliveries', label: 'Deliveries' },
    { key: 'tracker', label: 'Studio Tracker' },
    { key: 'media', label: 'Media' },
    { key: 'reminders', label: 'Reminders' },
    { key: 'invoice', label: 'Invoice' },
  ];

    constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private storageService: StorageService,
    private cdr: ChangeDetectorRef,
  ) {}



  ngOnInit(): void {
    const bookingId = this.route.snapshot.paramMap.get('id');
    if (!bookingId) {
      this.error = 'Booking not found';
      this.loading = false;
      return;
    }

    console.log('Loading booking with ID:', bookingId);

    this.bookingService.getBookingById(bookingId).subscribe({
      next: (response) => {
        console.log('Booking response:', response);
        // Map backend response to frontend format
        this.booking = this.bookingService.mapBackendToBooking(response.booking);
        console.log('Mapped booking:', this.booking);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading booking:', error);
        this.error = error?.error?.error || 'Failed to load booking';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  formatDate(value: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      weekday: 'long',
    });
  }

  formatAmount(value: number): string {
    return 'Rs. ' + Number(value).toLocaleString('en-IN');
  }

  get amountPaid(): number {
    return Number(this.booking?.amount_paid || 0);
  }

  get balanceDue(): number {
    return Number(this.booking?.total_amount || 0) - this.amountPaid;
  }

  get paymentProgress(): number {
    const total = Number(this.booking?.total_amount || 0);
    return total > 0 ? Math.round((this.amountPaid / total) * 100) : 0;
  }

  get crewCount(): number {
    return this.booking?.crew_assignments?.length ?? 0;
  }

  setTab(key: TabKey) {
    this.activeTab = key;
  }

  toggleWorkflow() {
    this.workflowOpen = !this.workflowOpen;
  }

  workflowBadgeClass(stage: string | undefined): string {
    if (stage === 'Full Payment Received' || stage === 'Completed') return 'badge-success';
    return 'badge-neutral';
  }

  updateWorkflowStage(stageName: string): void {
    if (!this.booking) return;
    
    const stageDef = WORKFLOW_STAGES.find(s => s.name === stageName);
    if (!stageDef) return;
    
    this.bookingService.updateBooking(this.booking.id, {
      current_workflow_stage: stageDef.dbStage
    }).subscribe({
      next: (response) => {
        if (this.booking) {
          this.booking.current_workflow_stage = stageDef.dbStage;
          this.cdr.detectChanges();
        }
        this.showToast('Stage Updated', `Workflow stage updated to ${stageName}`);
      },
      error: (error) => {
        console.error('Error updating workflow stage:', error);
        this.showToast('Error', 'Failed to update workflow stage');
      }
    });
  }

  private showToast(
    title: string,
    message: string,
    variant: 'success' | 'error' = 'success',
  ): void {
    clearTimeout(this.toastTimeout);

    setTimeout(() => {
      this.toastTitle = title;
      this.toastMsg = message;
      this.toastVariant = variant;
      this.toastVisible = true;
      this.cdr.detectChanges();
    }, 0);

    this.toastTimeout = setTimeout(() => {
      this.toastVisible = false;
      this.cdr.detectChanges();
    }, 2500);
  }

  onToastClosed(): void {
    this.toastVisible = false;
    clearTimeout(this.toastTimeout);
  }

  // --- Crew tab event handlers ---
  onCrewAddDay(data: NewEventDayData): void {
    if (!this.booking) return;
    
    // Use real API call instead of local update
    this.bookingService.addBookingEvent(this.booking.id, {
      event_name: data.eventType,
      event_date: data.datePending ? null : data.date,
      venue: data.venue,
      notes: data.notes
    }).subscribe({
      next: (response) => {
        // Add the new event to local booking data
        const newDay: BookingEvent = {
          id: response.event.id,
          event_name: response.event.event_name,
          event_date: response.event.event_date,
          venue: response.event.venue,
          notes: response.event.notes,
          date_pending: data.datePending
        };
        if (this.booking) {
          this.booking.event_days = [...(this.booking.event_days ?? []), newDay];
          this.cdr.detectChanges();
        }
        this.showToast('Event day added', 'The event day has been added successfully.');
      },
      error: (error) => {
        console.error('Error adding event day:', error);
        this.showToast('Error', 'Failed to add event day');
      }
    });
  }

  onCrewRemoveDay(e: BookingEvent): void {
    if (!this.booking?.event_days) return;
    
    // Use real API call to delete event
    this.bookingService.deleteBookingEvent(e.id).subscribe({
      next: (response) => {
        if (this.booking && this.booking.event_days) {
          this.booking.event_days = this.booking.event_days.filter((x) => x.id !== e.id);
          this.cdr.detectChanges();
        }
        this.showToast('Deleted', 'The event day has been removed.');
      },
      error: (error) => {
        console.error('Error deleting event day:', error);
        this.showToast('Error', 'Failed to delete event day');
      }
    });
  }

  onCrewAssignMember(data: NewAssignmentData): void {
    console.log('BookingDetail: onCrewAssignMember called with data:', data);
    if (!this.booking) return;
    
    console.log('BookingDetail: Calling addCrewAssignment API');
    // Use real API call to create crew assignment
    this.bookingService.addCrewAssignment({
      booking_event_id: data.eventDayId,
      staff_id: data.staffId,
      assigned_role: data.role,
      assignment_date: data.eventDate || new Date().toISOString().split('T')[0],
      start_time: data.reportTime,
      end_time: null,
      status: 'assigned',
      notes: data.reportLocation
    }).subscribe({
      next: (response) => {
        console.log('BookingDetail: API response:', response);
        const returned = response.crewAssignment || response.assignment || {};
        const matchedEventDay = this.booking?.event_days?.find((e) => e.id === data.eventDayId);

        const newAssignment: CrewAssignment = {
          id: returned.id ?? `${data.eventDayId}-${data.staffId}-${Date.now()}`,
          staff_name: returned.staff_name || data.staffName || 'Crew Member',
          assigned_role: returned.assigned_role || data.role,
          event_name: returned.event_name || data.eventName || matchedEventDay?.event_name || '',
          event_date: returned.event_date || data.eventDate || matchedEventDay?.event_date || '',
          event_time: returned.start_time || data.reportTime,
          venue: returned.venue || data.reportLocation || data.venue || matchedEventDay?.venue || null,
          status: returned.status || 'assigned',
          is_full_day: data.shift === 'full_day',
          is_notified: false,
          handover_status: 'pending',
          files_status: 'pending',
          submitted_at: null,
        };

        if (this.booking) {
          this.booking = {
            ...this.booking,
            crew_assignments: [...(this.booking.crew_assignments ?? []), newAssignment],
          };
          this.cdr.detectChanges(); // ✅ FIX: Force UI refresh
        }
        this.showToast('Crew assigned', `${newAssignment.staff_name} has been assigned as ${newAssignment.assigned_role}.`);
      },
      error: (error) => {
        console.error('BookingDetail: Error assigning crew:', error);
        console.error('Error details:', error.error, error.message, error.status);
        this.showToast('Error', `Failed to assign crew member: ${error.message || error.status || 'Unknown error'}`, 'error');
      },
    });
  }

  onCrewVerifyFiles(a: CrewAssignment): void {
    /* TODO */
  }

  onCrewRemoveAssignment(a: CrewAssignment): void {
    if (!this.booking?.crew_assignments) return;
    
    // Use real API call to delete crew assignment
    this.bookingService.deleteCrewAssignment(a.id).subscribe({
      next: (response) => {
        if (this.booking && this.booking.crew_assignments) {
          this.booking.crew_assignments = this.booking.crew_assignments.filter((x) => x.id !== a.id);
          this.cdr.detectChanges(); // ✅ FIX: Force UI refresh
        }
        this.showToast('Deleted', 'The crew assignment has been removed.');
      },
      error: (error) => {
        console.error('Error removing crew assignment:', error);
        this.showToast('Error', 'Failed to remove crew assignment');
      }
    });
  }

  // --- Payments tab event handlers ---
  onPaymentCreate(data: any): void {
    if (!this.booking) return;
    
    // Use real API call to create payment
    this.bookingService.addPayment({
      invoice_id: null, // Could be linked to invoice later
      booking_id: this.booking.id,
      amount: Number(data.amount) || 0,
      payment_date: data.dueDate || new Date().toISOString().split('T')[0],
      payment_method: 'cash', // Default, could be enhanced
      transaction_reference: null,
      status: 'completed',
      notes: data.notes || null
    }).subscribe({
      next: (response) => {
        // Add the new payment to local booking data
        const newItem: PaymentSchedule = {
          id: response.payment.id,
          installment_name: data.label,
          amount: Number(data.amount) || 0,
          due_date: data.dueDate || null,
          paid_date: response.payment.payment_date,
          status: 'Approved',
          notes: data.notes || null,
        };
        if (this.booking) {
          this.booking.payment_schedule = [...(this.booking.payment_schedule ?? []), newItem];
          this.cdr.detectChanges(); // ✅ FIX: Force UI refresh
        }
        this.showToast('Payment added', 'The payment installment has been added successfully.');
      },
      error: (error) => {
        console.error('Error adding payment:', error);
        this.showToast('Error', 'Failed to add payment');
      }
    });
  }

  onPaymentDelete(p: PaymentSchedule): void {
    if (!this.booking?.payment_schedule) return;
    
    // Use real API call to delete payment
    this.bookingService.deletePayment(p.id).subscribe({
      next: (response) => {
        if (this.booking && this.booking.payment_schedule) {
          this.booking.payment_schedule = this.booking.payment_schedule.filter((x) => x.id !== p.id);
          this.cdr.detectChanges(); // ✅ FIX: Force UI refresh
        }
        this.showToast('Deleted', 'The payment installment has been removed.');
      },
      error: (error) => {
        console.error('Error deleting payment:', error);
        this.showToast('Error', 'Failed to delete payment');
      }
    });
  }

  // --- Deliveries tab event handlers ---
  onDeliveryCreate(data: NewDeliveryData): void {
    if (!this.booking) return;
    
    // Use real API call to create delivery
    this.bookingService.addDelivery({
      booking_id: this.booking.id,
      delivery_type: data.type,
      delivery_date: data.dueDate,
      delivery_status: 'pending',
      delivery_link: null,
      recipient: null,
      confirmation: false,
      notes: data.notes
    }).subscribe({
      next: (response) => {
        // Add the new delivery to local booking data
        const newItem: DeliveryItem = {
          id: response.delivery.id,
          type: data.type,
          description: data.description,
          due_date: data.dueDate || null,
          status: 'Pending',
          delivered_date: null,
          notes: data.notes || null,
        };
        if (this.booking) {
          this.booking.deliveries = [...(this.booking.deliveries ?? []), newItem];
          this.cdr.detectChanges(); // ✅ FIX: Force UI refresh
        }
        this.showToast('Delivery added', 'The delivery item has been added successfully.');
      },
      error: (error) => {
        console.error('Error adding delivery:', error);
        this.showToast('Error', 'Failed to add delivery');
      }
    });
  }

  onDeliveryStart(d: DeliveryItem): void {
    // Use real API call to update delivery status
    this.bookingService.updateDelivery(d.id, {
      delivery_status: 'in_progress'
    }).subscribe({
      next: (response) => {
        d.status = 'In Progress';
        this.cdr.detectChanges(); // ✅ FIX: Force UI refresh
      },
      error: (error) => {
        console.error('Error updating delivery:', error);
        this.showToast('Error', 'Failed to update delivery status');
      }
    });
  }

  onDeliveryMarkReady(d: DeliveryItem): void {
    // Use real API call to mark delivery as delivered
    this.bookingService.updateDelivery(d.id, {
      delivery_status: 'delivered',
      delivery_date: new Date().toISOString().split('T')[0]
    }).subscribe({
      next: (response) => {
        d.status = 'Delivered';
        d.delivered_date = new Date().toISOString();
        this.cdr.detectChanges(); // ✅ FIX: Force UI refresh
      },
      error: (error) => {
        console.error('Error updating delivery:', error);
        this.showToast('Error', 'Failed to mark delivery as ready');
      }
    });
  }

  onDeliveryDelete(d: DeliveryItem): void {
    if (!this.booking?.deliveries) return;
    
    // Use real API call to delete delivery
    this.bookingService.deleteDelivery(d.id).subscribe({
      next: (response) => {
        if (this.booking && this.booking.deliveries) {
          this.booking.deliveries = this.booking.deliveries.filter((x) => x.id !== d.id);
          this.cdr.detectChanges(); // ✅ FIX: Force UI refresh
        }
        this.showToast('Deleted', 'The delivery item has been removed.');
      },
      error: (error) => {
        console.error('Error deleting delivery:', error);
        this.showToast('Error', 'Failed to delete delivery');
      }
    });
  }

  // --- Media tab event handlers ---
  onMediaCreate(data: NewMediaItemData): void {
    if (!this.booking) return;
    
    // Use storage service to create media item
    this.storageService.uploadFile({
      bookingId: this.booking.id,
      fileName: data.label,
      fileType: data.mediaType,
      category: 'general',
      storagePath: data.mediaType.toLowerCase(),
      fileSize: 0, // Placeholder for now
      status: 'active',
      notes: data.notes
    }, null as any).subscribe({
      next: (response) => {
        // Add the new media item to local booking data
        const newItem: MediaItem = {
          id: response.file?.id || 'm' + Date.now(),
          media_type: data.mediaType,
          label: data.label,
          capacity: data.capacity || null,
          photographer: data.photographer || null,
          notes: data.notes || null,
        };
        if (this.booking) {
          this.booking.media = [...(this.booking.media ?? []), newItem];
          this.cdr.detectChanges(); // ✅ FIX: Force UI refresh
        }
        this.showToast('Media added', 'The storage item has been added successfully.');
      },
      error: (error) => {
        console.error('Error adding media:', error);
        this.showToast('Error', 'Failed to add media item');
      }
    });
  }

  onMediaDelete(m: MediaItem): void {
    if (!this.booking?.media) return;
    
    // Use storage service to delete media item
    this.storageService.deleteFile(m.id).subscribe({
      next: (response) => {
        if (this.booking && this.booking.media) {
          this.booking.media = this.booking.media.filter((x) => x.id !== m.id);
          this.cdr.detectChanges(); // ✅ FIX: Force UI refresh
        }
        this.showToast('Deleted', 'The storage item has been removed.');
      },
      error: (error) => {
        console.error('Error deleting media:', error);
        this.showToast('Error', 'Failed to delete media item');
      }
    });
  }

  // state
  isBookingDetailsModalOpen = false;
 
   onOpenBookingDetailsModal(): void {
    this.isBookingDetailsModalOpen = true;
  }

  onCloseBookingDetailsModal(): void {
    this.isBookingDetailsModalOpen = false;
  }

  // --- Reminders tab event handlers ---
  onReminderCreated(): void {
    if (!this.booking) return;
    
    // Reload booking to get updated reminders
    this.bookingService.getBookingById(this.booking.id).subscribe({
      next: (response) => {
        this.booking = this.bookingService.mapBackendToBooking(response.booking);
        this.cdr.detectChanges();
        this.showToast('Reminder created', 'The reminder has been created successfully.');
      },
      error: (error) => {
        console.error('Error reloading booking:', error);
        this.showToast('Error', 'Failed to reload booking data');
      }
    });
  }

  onReminderDeleted(): void {
    if (!this.booking) return;
    
    // Reload booking to get updated reminders
    this.bookingService.getBookingById(this.booking.id).subscribe({
      next: (response) => {
        this.booking = this.bookingService.mapBackendToBooking(response.booking);
        this.cdr.detectChanges();
        this.showToast('Deleted', 'The reminder has been removed.');
      },
      error: (error) => {
        console.error('Error reloading booking:', error);
        this.showToast('Error', 'Failed to reload booking data');
      }
    });
  }

  onCancelBooking(): void {
    if (!this.booking) return;
    
    if (confirm(`Are you sure you want to cancel and delete booking ${this.booking.booking_number} for ${this.booking.client_name}? This action cannot be undone.`)) {
      this.bookingService.deleteBooking(this.booking.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.showToast('Booking Cancelled', 'The booking has been successfully cancelled and deleted.');
            // Navigate back to bookings list
            window.location.href = '/bookings';
          } else {
            this.showToast('Error', response.message || 'Failed to cancel booking');
          }
        },
        error: (error) => {
          console.error('Error cancelling booking:', error);
          this.showToast('Error', 'Failed to cancel booking. Please try again.');
        }
      });
    }
  }

onSaveBookingDetails(data: BookingDetailsFormData): void {
  if (!this.booking) return;

  // TODO: real API call once endpoint confirmed — merging into local mock for now
  Object.assign(this.booking, {
    main_event_date: data.mainEventDate,
    booking_date: data.bookingDate,
    project_division: data.projectDivision,
    event_type: data.eventType,
    client_manager: data.clientManager,
    selection_upload_process: data.selectionUploadProcess,
    review_notes: data.reviewNotes,
    package_id: data.packageId,
    venue: data.venue,
    map_link: data.mapLink,
    status: data.status,
    total_amount: data.totalAmount,
    notes: data.notes,
    remarks: data.remarks,
  });

  this.isBookingDetailsModalOpen = false;
  this.cdr.detectChanges(); // ✅ FIX: Force UI refresh

  this.toastTitle = 'Booking updated';
  this.toastMsg = '';
  this.toastVariant = 'success';
  this.toastVisible = true;
}

  // --- Header actions: Notify Crew, Cancel Booking ---
  isNotifying = false;
  showCancelConfirm = false;
  isCancelling = false;

  onNotifyCrew(): void {
    if (this.isNotifying) return;
    this.isNotifying = true;

    // ASSUMPTION: simulated delay — replace with real API call once endpoint confirmed
    setTimeout(() => {
      this.isNotifying = false;
      this.showToast('Crew notified successfully', '');
      this.cdr.detectChanges();
    }, 1000);
  }

  onOpenCancelConfirm(): void {
    this.showCancelConfirm = true;
  }

  onKeepBooking(): void {
    this.showCancelConfirm = false;
  }

  onConfirmCancelBooking(): void {
    if (!this.booking) return;
    this.isCancelling = true;

    // ASSUMPTION: simulated delay — replace with real API call (DELETE booking) once endpoint confirmed
    setTimeout(() => {
      this.isCancelling = false;
      this.showCancelConfirm = false;
      this.router.navigate(['/bookings']);
    }, 800);
  }
  
}