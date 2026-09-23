import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Booking {
  id: string;
  booking_number: string;
  booking_date: string;
  event_date: string | null;
  client_id: string;
  client_name: string;
  package_id: string;
  package_name: string;
  total_amount: number;
  status: string;
  current_workflow_stage: string;
  venue: string | null;
  notes: string | null;
  amount_paid?: number;
  event_days?: BookingEvent[];
  payment_schedule?: PaymentSchedule[];
  package_crew_plan?: CrewPlanDay[];
  crew_assignments?: CrewAssignment[];
  project_division?: string | null; // ASSUMPTION
  event_type?: string | null; // ASSUMPTION
  client_manager?: string | null; // ASSUMPTION
  selection_upload_process?: string | null; // ASSUMPTION
  review_notes?: string | null; // ASSUMPTION
  map_link?: string | null; // ASSUMPTION
  remarks?: string | null; // ASSUMPTION
  deliveries?: DeliveryItem[];
  media?: MediaItem[];
  reminders?: ReminderLog[]; // ASSUMPTION — new field, not in original interface
  client_phone?: string | null; // ASSUMPTION
  client_email?: string | null; // ASSUMPTION
  client_address?: string | null;

}

export interface BookingEvent {
  id: string; // ASSUMPTION — needed to uniquely target a day for delete (duplicate event_names possible)
  event_name: string;
  event_date: string | null; // ASSUMPTION — null when date is pending
  venue: string | null;
  notes?: string | null; // ASSUMPTION
  date_pending?: boolean; // ASSUMPTION
}

export interface MediaItem {
  id: string;
  media_type: string; // 'Memory Card' | 'Hard Disk' | 'Pen Drive' | 'SD Card' | 'CFexpress Card'
  label: string;
  capacity?: string | null;
  photographer?: string | null; // "With Photographer"
  notes?: string | null;
}

export interface ReminderLog {
  id: string;
  reminder_type: string; // 'client_reminder' | 'crew_details_customer' | 'payment_reminder' | 'event_reminder'
  days_before_event: number;
  scheduled_date: string;
  scheduled_time: string | null;
  status: 'pending' | 'sent' | 'skipped' | 'failed';
}

export interface PaymentSchedule {
  id: string; // ASSUMPTION — delete/update-er jonno lagবে
  installment_name: string;
  amount: number; // ASSUMPTION — percentage-er bodole direct amount, screenshot onujayi
  percentage?: number; // rakhলাম, jodi kothaও ব্যবহার hocche
  due_date: string | null; // ASSUMPTION
  paid_date: string | null; // ASSUMPTION
  status: string; // ASSUMPTION — 'approved' | 'pending' etc.
  notes?: string | null; // ASSUMPTION
}

export interface CrewPlanDay {
  day_number: number;
  event_type: string;
  roles: { role: string; quantity: number }[];
}

export interface CrewAssignment {
  id: string; // ASSUMPTION — needed for delete/verify actions
  staff_name: string;
  assigned_role: string;
  event_name: string;
  event_date: string;
  event_time?: string; // ASSUMPTION — "10:00 am" screenshot-e dekha gele, sob row-e nei
  venue: string | null;
  status: string;
  is_full_day?: boolean; // ASSUMPTION
  is_notified?: boolean; // ASSUMPTION
  handover_status?: 'submitted' | 'pending'; // ASSUMPTION
  files_status?: 'submitted' | 'pending'; // ASSUMPTION
  submitted_at?: string | null; // ASSUMPTION
}

export interface DeliveryItem {
  id: string;
  type: string; // 'Album Design' | 'Album Print' | 'Video Edit' | etc.
  description: string;
  due_date: string | null;
  status: 'Pending' | 'In Progress' | 'Delivered'; // ASSUMPTION
  delivered_date: string | null;
  notes?: string | null;
}

export interface CreateBookingRequest {
  clientId: string;
  packageId: string;
  bookingDate?: string;
  eventDate: string;
  eventType?: string;
  totalAmount: number;
  venue: string;
  status?: string;
  currentWorkflowStage?: string;
  notes?: string;
}

export interface BookingListResponse {
  success: boolean;
  bookings: Booking[];
  count: number;
}

export interface BookingResponse {
  success: boolean;
  booking: Booking;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string; // matches CrewPlanDay role names — 'Photographer', 'Cinematographer', etc.
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly apiUrl = 'https://wedflow-codeflare.onrender.com/api/bookings';

  constructor(private http: HttpClient) {}

  getBookings(): Observable<BookingListResponse> {
    return this.http.get<BookingListResponse>(this.apiUrl);
  }

  getBookingById(id: string): Observable<BookingResponse> {
    return this.http.get<BookingResponse>(`${this.apiUrl}/${id}`);
  }

  createBooking(booking: CreateBookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(this.apiUrl, booking);
  }

  updateBooking(bookingId: string, bookingData: any): Observable<BookingResponse> {
    return this.http.put<BookingResponse>(`${this.apiUrl}/${bookingId}`, bookingData);
  }

  // Map backend booking response to frontend format
  mapBackendToBooking(backendBooking: any): any {
    return {
      id: backendBooking.id,
      booking_number: backendBooking.booking_number,
      booking_date: backendBooking.booking_date,
      event_date: backendBooking.event_date || null,
      client_id: backendBooking.client_id,
      client_name: backendBooking.client_name,
      package_id: backendBooking.package_id,
      package_name: backendBooking.package_name,
      total_amount: backendBooking.total_amount,
      status: backendBooking.status,
      current_workflow_stage: backendBooking.current_workflow_stage,
      venue: backendBooking.venue,
      notes: backendBooking.notes,
      amount_paid: backendBooking.amount_paid,
      event_days: backendBooking.event_days || [],
      payment_schedule: backendBooking.payment_schedule || [],
      package_crew_plan: this.mapPackageCrewPlan(backendBooking.package_crew_plan || []),
      crew_assignments: this.mapCrewAssignments(backendBooking.crew_assignments || []),
      deliveries: [],
      media: [],
      reminders: this.mapReminders(backendBooking.reminders || [])
    };
  }

  private mapPackageCrewPlan(backendPlan: any[]): any[] {
    return backendPlan.map(day => ({
      day_number: day.day_number,
      event_type: day.event_type,
      roles: day.roles?.map((role: any) => ({
        role: role.role,
        quantity: role.quantity
      })) || []
    }));
  }

  private mapCrewAssignments(backendAssignments: any[]): any[] {
    return backendAssignments.map((assignment: any) => ({
      id: assignment.id,
      staff_name: assignment.staff_name,
      assigned_role: assignment.assigned_role,
      event_name: assignment.event_name,
      event_date: assignment.event_date,
      event_time: assignment.start_time,
      venue: assignment.venue,
      status: assignment.status,
      is_full_day: true, // Default assumption
      is_notified: false, // Default assumption
      handover_status: 'pending',
      files_status: 'pending',
      submitted_at: null
    }));
  }

  private mapReminders(backendReminders: any[]): any[] {
    return backendReminders.map((reminder: any) => ({
      id: reminder.id,
      reminder_type: reminder.reminder_type,
      days_before_event: reminder.days_before_event,
      scheduled_date: reminder.scheduled_date,
      scheduled_time: reminder.scheduled_time || null,
      status: reminder.status
    }));
  }

  // Get staff from User Management API (staff members)
  getStaff(): Observable<{ success: boolean; users: any[]; count: number }> {
    return this.http.get<{ success: boolean; users: any[]; count: number }>('https://wedflow-codeflare.onrender.com/api/staff-members');
  }

  // Get packages from backend
  getPackages(): Observable<{ success: boolean; packages: any[]; count: number }> {
    return this.http.get<{ success: boolean; packages: any[]; count: number }>('https://wedflow-codeflare.onrender.com/api/packages');
  }

  // Event Days API methods
  addBookingEvent(bookingId: string, eventData: any): Observable<{ success: boolean; event: any }> {
    return this.http.post<{ success: boolean; event: any }>('https://wedflow-codeflare.onrender.com/api/booking-events', {
      booking_id: bookingId,
      ...eventData
    });
  }

  updateBookingEvent(eventId: string, eventData: any): Observable<{ success: boolean; event: any }> {
    return this.http.put<{ success: boolean; event: any }>(`https://wedflow-codeflare.onrender.com/api/booking-events/${eventId}`, eventData);
  }

  deleteBookingEvent(eventId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`https://wedflow-codeflare.onrender.com/api/booking-events/${eventId}`);
  }

  deleteBooking(bookingId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`https://wedflow-codeflare.onrender.com/api/bookings/${bookingId}`);
  }

  // Crew Assignment API methods
  addCrewAssignment(assignmentData: any): Observable<{ success: boolean; crewAssignment?: any; assignment?: any }> {
    return this.http.post<{ success: boolean; crewAssignment?: any; assignment?: any }>('https://wedflow-codeflare.onrender.com/api/crew-assignments', assignmentData);
  }

  updateCrewAssignment(assignmentId: string, assignmentData: any): Observable<{ success: boolean; assignment: any }> {
    return this.http.put<{ success: boolean; assignment: any }>(`https://wedflow-codeflare.onrender.com/api/crew-assignments/${assignmentId}`, assignmentData);
  }

  deleteCrewAssignment(assignmentId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`https://wedflow-codeflare.onrender.com/api/crew-assignments/${assignmentId}`);
  }

  // Payment API methods
  addPayment(paymentData: any): Observable<{ success: boolean; payment: any }> {
    return this.http.post<{ success: boolean; payment: any }>('https://wedflow-codeflare.onrender.com/api/payments', paymentData);
  }

  updatePayment(paymentId: string, paymentData: any): Observable<{ success: boolean; payment: any }> {
    return this.http.put<{ success: boolean; payment: any }>(`https://wedflow-codeflare.onrender.com/api/payments/${paymentId}`, paymentData);
  }

  deletePayment(paymentId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`https://wedflow-codeflare.onrender.com/api/payments/${paymentId}`);
  }

  // Delivery API methods
  addDelivery(deliveryData: any): Observable<{ success: boolean; delivery: any }> {
    return this.http.post<{ success: boolean; delivery: any }>('https://wedflow-codeflare.onrender.com/api/deliveries', deliveryData);
  }

  updateDelivery(deliveryId: string, deliveryData: any): Observable<{ success: boolean; delivery: any }> {
    return this.http.put<{ success: boolean; delivery: any }>(`https://wedflow-codeflare.onrender.com/api/deliveries/${deliveryId}`, deliveryData);
  }

  deleteDelivery(deliveryId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`https://wedflow-codeflare.onrender.com/api/deliveries/${deliveryId}`);
  }
}
