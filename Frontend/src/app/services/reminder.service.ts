import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Reminder {
  id: string;
  booking_id: string;
  reminder_type: string;
  days_before_event: number;
  scheduled_date: string;
  scheduled_time: string | null;
  sent_date: string | null;
  status: string;
  recipient_email: string;
  subject: string | null;
  message_content: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  workspace_id: string;
}

export interface CreateReminderRequest {
  booking_id: string;
  reminder_type: string;
  days_before_event: number;
  scheduled_date: string;
  scheduled_time?: string;
  recipient_email: string;
  subject?: string;
  message_content?: string;
}

export interface UpdateReminderRequest {
  reminder_type?: string;
  days_before_event?: number;
  scheduled_date?: string;
  scheduled_time?: string;
  recipient_email?: string;
  subject?: string;
  message_content?: string;
  status?: string;
}

export interface ReminderListResponse {
  success: boolean;
  reminders: Reminder[];
  count: number;
}

export interface ReminderResponse {
  success: boolean;
  reminder: Reminder;
}

@Injectable({ providedIn: 'root' })
export class ReminderService {
  private readonly apiUrl = 'https://wedflow-codeflare.onrender.com/api/reminders';

  constructor(private http: HttpClient) {}

  getRemindersByBooking(bookingId: string): Observable<ReminderListResponse> {
    return this.http.get<ReminderListResponse>(`${this.apiUrl}/${bookingId}`);
  }

  createReminder(reminder: CreateReminderRequest): Observable<ReminderResponse> {
    return this.http.post<ReminderResponse>(this.apiUrl, reminder);
  }

  updateReminder(id: string, reminder: UpdateReminderRequest): Observable<ReminderResponse> {
    return this.http.put<ReminderResponse>(`${this.apiUrl}/${id}`, reminder);
  }

  deleteReminder(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }
}