import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BookingService, Booking as ApiBooking } from '../../services/booking.service';
import { CdkDragDrop, moveItemInArray, transferArrayItem, CdkDropList } from '@angular/cdk/drag-drop';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Auth } from '../../services/auth';

interface StageBooking {
  id: string;
  bookingId: string;
  clientName: string;
  eventDate: string | null;
  packageName: string;
  venue: string | null;
  currentStage: string;
}

type StageCategory =
  | 'Lead'
  | 'Sales'
  | 'Booking'
  | 'Accounts'
  | 'Planning'
  | 'Team'
  | 'Shoot'
  | 'Post Production'
  | 'Review'
  | 'Delivery'
  | 'Complete'
  | 'Archive';

interface WorkflowStageColumn {
  key: string;
  label: string;
  category: StageCategory;
  bookings: StageBooking[];
}

const STAGE_DEFS: { key: string; label: string; category: StageCategory }[] = [
  { key: 'Booking Confirmed', label: 'Booking Confirmed', category: 'Booking' },
  { key: 'Advance Received', label: 'Advance Received', category: 'Accounts' },
  { key: 'Contract Signed', label: 'Contract Signed', category: 'Booking' },
  { key: 'Planning Stage', label: 'Planning Stage', category: 'Planning' },
  { key: 'Crew Assigned', label: 'Crew Assigned', category: 'Team' },
  { key: 'Pre-Wedding Scheduled', label: 'Pre-Wedding Scheduled', category: 'Shoot' },
  { key: 'Event Completed', label: 'Event Completed', category: 'Shoot' },
  { key: 'Data Received', label: 'Data Received', category: 'Post Production' },
  { key: 'Editing Assigned', label: 'Editing Assigned', category: 'Post Production' },
  { key: 'Editing In Progress', label: 'Editing In Progress', category: 'Post Production' },
  { key: 'QC Review', label: 'QC Review', category: 'Review' },
  { key: 'Client Review', label: 'Client Review', category: 'Review' },
  { key: 'Revision Requested', label: 'Revision Requested', category: 'Review' },
  { key: 'Payment Pending', label: 'Payment Pending', category: 'Accounts' },
  { key: 'Full Payment Received', label: 'Full Payment Received', category: 'Accounts' },
  { key: 'Album Designing', label: 'Album Designing', category: 'Delivery' },
  { key: 'Album Printing', label: 'Album Printing', category: 'Delivery' },
  { key: 'Ready For Delivery', label: 'Ready For Delivery', category: 'Delivery' },
  { key: 'Delivered', label: 'Delivered', category: 'Delivery' },
  { key: 'Completed', label: 'Completed', category: 'Complete' },
  { key: 'Archived', label: 'Archived', category: 'Archive' },
  { key: 'Lead Received', label: 'Lead Received', category: 'Lead' },
  { key: 'Follow-up Pending', label: 'Follow-up Pending', category: 'Lead' },
  { key: 'Quotation Sent', label: 'Quotation Sent', category: 'Sales' },
  { key: 'Negotiation', label: 'Negotiation', category: 'Sales' },
];

// Mapping between database workflow stages and frontend workflow stages
const DB_TO_FRONTEND_STAGE_MAP: Record<string, string> = {
  'booking': 'Booking Confirmed',
  'planning': 'Planning Stage',
  'production': 'Event Completed',
  'post_production': 'Editing In Progress',
  'qc': 'QC Review',
  'client_review': 'Client Review',
  'revision': 'Revision Requested',
  'album': 'Album Designing',
  'delivery': 'Ready For Delivery',
  'completed': 'Completed',
};

// Mapping from frontend stages back to database stages
const FRONTEND_TO_DB_STAGE_MAP: Record<string, string> = {
  'Booking Confirmed': 'booking',
  'Advance Received': 'booking',
  'Contract Signed': 'booking',
  'Planning Stage': 'planning',
  'Crew Assigned': 'planning',
  'Pre-Wedding Scheduled': 'production',
  'Event Completed': 'production',
  'Data Received': 'post_production',
  'Editing Assigned': 'post_production',
  'Editing In Progress': 'post_production',
  'QC Review': 'qc',
  'Client Review': 'client_review',
  'Revision Requested': 'revision',
  'Payment Pending': 'delivery',
  'Full Payment Received': 'delivery',
  'Album Designing': 'album',
  'Album Printing': 'album',
  'Ready For Delivery': 'delivery',
  'Delivered': 'delivery',
  'Completed': 'completed',
  'Archived': 'completed',
  'Lead Received': 'booking',
  'Follow-up Pending': 'booking',
  'Quotation Sent': 'booking',
  'Negotiation': 'booking',
};

@Component({
  selector: 'app-workflow-board',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DragDropModule],
  templateUrl: './workflow-board.html',
  styleUrl: './workflow-board.scss',
})
export class WorkflowBoard implements OnInit, AfterViewInit {
  isLoading = false;
  searchTerm = '';
  columns: WorkflowStageColumn[] = [];
  error: string | null = null;
  loadingTimeout: any = null;

  constructor(private bookingService: BookingService, private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    console.log('Workflow Board: ngOnInit called');
    this.loadBoard();
  }

  ngAfterViewInit(): void {
    console.log('Workflow Board: ngAfterViewInit called');
    // Force change detection to ensure UI updates
    this.cdr.detectChanges();
  }

  loadBoard(): void {
    this.isLoading = true;
    this.error = null;

    console.log('Workflow Board: Starting loadBoard...');

    // Small delay to ensure Angular change detection is ready
    setTimeout(() => {
      // Set timeout to prevent infinite loading
      this.loadingTimeout = setTimeout(() => {
        if (this.isLoading) {
          console.error('Workflow Board: Loading timeout reached');
          this.error = 'Loading timeout. Please check your connection and try again.';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      }, 30000); // 30 second timeout

      this.bookingService.getBookings().subscribe({
        next: (response) => {
          console.log('Workflow Board: Bookings loaded:', response);
          const bookings = response?.bookings ?? [];
          console.log('Workflow Board: Number of bookings:', bookings.length);
          
          // Clear timeout on success
          if (this.loadingTimeout) {
            clearTimeout(this.loadingTimeout);
          }
          
          if (bookings.length === 0) {
            console.log('Workflow Board: No bookings found');
            this.columns = STAGE_DEFS.map((def) => ({
              ...def,
              bookings: [],
            }));
            this.isLoading = false;
            this.cdr.detectChanges();
            return;
          }
          
          // Map backend bookings to frontend format
          const mappedBookings = bookings.map((b) => {
            console.log('Processing booking:', b);
            const mapped = this.bookingService.mapBackendToBooking(b);
            console.log('Mapped booking:', mapped);
            
            // Map database workflow stage to frontend stage
            const dbStage = mapped.current_workflow_stage || 'booking';
            const frontendStage = DB_TO_FRONTEND_STAGE_MAP[dbStage] || 'Booking Confirmed';
            console.log(`Booking ${b.booking_number}: DB stage="${dbStage}" -> Frontend stage="${frontendStage}"`);
            
            return this.mapBooking(mapped, frontendStage);
          });
          
          console.log('Workflow Board: Mapped bookings:', mappedBookings);
          
          this.columns = STAGE_DEFS.map((def) => ({
            ...def,
            bookings: mappedBookings.filter((b) => {
              // Match current_workflow_stage with stage key
              const bookingStage = b.currentStage || '';
              return bookingStage === def.key;
            }),
          }));
          
          console.log('Workflow Board: Columns built:', this.columns);
          console.log('Workflow Board: Total bookings across all columns:', this.columns.reduce((sum, col) => sum + col.bookings.length, 0));
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading workflow board:', error);
          console.error('Error details:', error.status, error.error);
          
          if (this.loadingTimeout) {
            clearTimeout(this.loadingTimeout);
          }
          
          this.error = `Failed to load bookings: ${error.message || error.status || 'Unknown error'}`;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
    }, 100);
  }

  private mapBooking(b: ApiBooking, frontendStage?: string): StageBooking {
    return {
      id: b.id,
      bookingId: b.booking_number,
      clientName: b.client_name,
      eventDate: b.event_date || b.booking_date,
      packageName: b.package_name,
      venue: b.venue,
      currentStage: frontendStage || 'Booking Confirmed',
    };
  }

  get activeBookingCount(): number {
    return this.columns.reduce((sum, col) => sum + col.bookings.length, 0);
  }

  get filteredColumns(): WorkflowStageColumn[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.columns;

    return this.columns.map((col) => ({
      ...col,
      bookings: col.bookings.filter(
        (b) =>
          b.clientName.toLowerCase().includes(term) ||
          b.bookingId.toLowerCase().includes(term),
      ),
    }));
  }

  formatDate(value: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  countBadgeClass(count: number): string {
    return count > 0 ? 'badge-count-active' : 'badge-count-empty';
  }

  trackByStageKey(index: number, item: WorkflowStageColumn): string {
    return item.key;
  }

  trackByBookingId(index: number, item: StageBooking): string {
    return item.id;
  }

  drop(event: CdkDragDrop<StageBooking[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      
      // Update the booking's workflow stage in the database
      const movedBooking = event.container.data[event.currentIndex];
      const containerElement = event.container.element.nativeElement;
      const stageCard = containerElement.closest('.stage-card');
      const newStage = stageCard?.getAttribute('data-stage');
      
      if (newStage && movedBooking) {
        this.updateBookingStage(movedBooking.id, newStage);
      }
    }
  }

  updateBookingStage(bookingId: string, newStage: string): void {
    const dbStage = FRONTEND_TO_DB_STAGE_MAP[newStage];
    if (!dbStage) {
      console.error('Invalid stage:', newStage);
      return;
    }

    this.bookingService.updateBooking(bookingId, {
      current_workflow_stage: dbStage
    }).subscribe({
      next: (response) => {
        console.log('Booking stage updated successfully:', response);
      },
      error: (error) => {
        console.error('Error updating booking stage:', error);
        // Revert the UI change on error
        this.loadBoard();
      }
    });
  }

  public testConnection(): void {
    console.log('Testing API connections...');
    this.isLoading = true;
    this.error = null;

    this.http.get('https://wedflow-codeflare.onrender.com/api/bookings').subscribe({
      next: (response) => {
        console.log('Bookings API test successful:', response);
        this.error = 'Bookings API working. Check console for details.';
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Bookings API test failed:', err);
        this.error = `Bookings API failed: ${err.status} - ${err.statusText || err.message}`;
        this.isLoading = false;
      }
    });
  }
}