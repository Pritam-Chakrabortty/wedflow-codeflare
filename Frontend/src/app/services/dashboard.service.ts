import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private apiUrl = 'http://localhost:5001/api/dashboard';

  constructor(private http: HttpClient) {}

  getSummary(): Observable<DashboardSummaryResponse> {
    return this.http.get<DashboardSummaryResponse>(`${this.apiUrl}/summary`);
  }

  getCalendarEvents(year: number, month: number): Observable<DashboardCalendarResponse> {
    return this.http.get<DashboardCalendarResponse>(`${this.apiUrl}/calendar?year=${year}&month=${month}`);
  }
}

