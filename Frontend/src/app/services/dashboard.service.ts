import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable ,of} from 'rxjs';
import { delay, map } from 'rxjs/operators';

export interface DashboardSummaryResponse {
  success: boolean;
  summary: {
    totalBookings: number;
    activeBookings: number;
    bookingValue: number;
    paidRevenue: number;
    outstandingValue: number;
    outstandingInvoices: number;
    totalJobs: number;
    activeJobs: number;
    completedJobs: number;
    totalReviews: number;
    pendingReviews: number;
    completedReviews: number;
    overdueReviews: number;
    upcomingEvents: number;
    unassignedCrewEvents: number;
  };
  unassignedEvents: any[];
  pendingInvoices: any[];
  recentBookings: any[];
  recentJobs: any[];
}

export interface DashboardCalendarEvent {
  id: string;
  bookingId: string;
  name: string;
  eventName: string;
  location: string;
  packageName: string;
  eventDate: string;
  needsCrew: boolean;
}

export interface DashboardCalendarResponse {
  success: boolean;
  events: DashboardCalendarEvent[];
  year: number;
  month: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'https://wedflow-codeflare.onrender.com/api/dashboard';

   // backend ready hole eta false kore dilei real PATCH call hobe
  private mockReschedule = true;

  private dateOverrides: Record<string, string> = {};            // eventId -> 'YYYY-MM-DD'
  private seenEvents = new Map<string, DashboardCalendarEvent>(); // ekhane porjonto dekha sob event

  constructor(private http: HttpClient) {}

  getSummary(): Observable<DashboardSummaryResponse> {
    return this.http.get<DashboardSummaryResponse>(`${this.apiUrl}/summary`);
  }

  getCalendarEvents(year: number, month: number): Observable<DashboardCalendarResponse> {
    return this.http
      .get<DashboardCalendarResponse>(`${this.apiUrl}/calendar?year=${year}&month=${month}`)
      .pipe(
        map((res) => {
          if (!this.mockReschedule) return res;

          (res.events || []).forEach((ev) => this.seenEvents.set(String(ev.id), ev));

          const events = Array.from(this.seenEvents.values())
            .map((ev) => {
              const o = this.dateOverrides[String(ev.id)];
              // 'T00:00:00' dile local time e parse hoy, tai date shift hoy na
              return o ? { ...ev, eventDate: `${o}T00:00:00` } : ev;
            })
            .filter((ev) => {
              const d = new Date(ev.eventDate);
              return d.getFullYear() === year && d.getMonth() + 1 === month;
            });

          return { ...res, events };
        })
      );
  }

  rescheduleEvent(eventId: string, eventDate: string): Observable<{ success: boolean }> {
    if (this.mockReschedule) {
      this.dateOverrides[String(eventId)] = eventDate;
      return of({ success: true }).pipe(delay(300)); // network er moto ektu delay
    }
    return this.http.patch<{ success: boolean }>(
      `${this.apiUrl}/booking-events/${eventId}/date`,
      { eventDate }
    );
  }
}

