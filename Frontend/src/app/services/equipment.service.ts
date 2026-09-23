import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type EquipmentType = 'camera' | 'drone' | 'memory_card' | 'hard_disk' | 'lens' | 'tripod' | 'light' | 'other';
export type EquipmentStatus = 'available' | 'assigned' | 'maintenance' | 'retired' | 'checked_out';

export interface EquipmentItem {
  id: string;
  name: string;
  type: EquipmentType;
  typeLabel: string;
  idNumber?: string;
  status: EquipmentStatus;
  checkedOutWith?: string;
  checkedOutSince?: Date;
  checkedOutDue?: Date;
  purchaseDate?: string;
  purchasePrice?: number;
  notes?: string;
}

export interface EquipmentAssignment {
  id: string;
  equipmentId: string;
  equipmentName: string;
  bookingEventId: string;
  eventName: string;
  eventDate: string;
  venue: string;
  staffId?: string;
  staffName?: string;
  assignedAt: string;
  returnedAt?: string;
  status: 'assigned' | 'returned' | 'lost' | 'damaged';
  notes?: string;
}

export interface NewEquipmentPayload {
  name: string;
  type: EquipmentType;
  typeLabel: string;
  serialNumber?: string;
  description?: string;
  purchaseDate?: string;
  purchasePrice?: number;
}

export interface CheckoutPayload {
  equipmentId: string;
  staffId: string;
  staffName: string;
  bookingEventId?: string;
  expectedReturnDate?: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {
  private apiUrl = 'https://wedflow-codeflare.onrender.com/api';

  constructor(private http: HttpClient) {}

  // Get all equipment
  getEquipment(): Observable<{ success: boolean; equipment: any[]; count: number }> {
    return this.http.get<{ success: boolean; equipment: any[]; count: number }>(`${this.apiUrl}/equipment`);
  }

  // Get single equipment item
  getEquipmentById(id: string): Observable<{ success: boolean; equipment: any }> {
    return this.http.get<{ success: boolean; equipment: any }>(`${this.apiUrl}/equipment/${id}`);
  }

  // Create new equipment
  createEquipment(payload: NewEquipmentPayload): Observable<{ success: boolean; equipment: any }> {
    return this.http.post<{ success: boolean; equipment: any }>(`${this.apiUrl}/equipment`, {
      name: payload.name,
      equipment_type: payload.type,
      serial_number: payload.serialNumber,
      purchase_date: payload.purchaseDate,
      purchase_price: payload.purchasePrice,
      status: 'available',
      notes: payload.description
    });
  }

  // Update equipment
  updateEquipment(id: string, payload: Partial<NewEquipmentPayload> & { status?: EquipmentStatus }): Observable<{ success: boolean; equipment: any }> {
    return this.http.put<{ success: boolean; equipment: any }>(`${this.apiUrl}/equipment/${id}`, {
      name: payload.name,
      equipment_type: payload.type,
      serial_number: payload.serialNumber,
      purchase_date: payload.purchaseDate,
      purchase_price: payload.purchasePrice,
      status: payload.status,
      notes: payload.description
    });
  }

  // Get equipment assignments
  getAssignments(): Observable<{ success: boolean; assignments: EquipmentAssignment[]; count: number }> {
    return this.http.get<{ success: boolean; assignments: EquipmentAssignment[]; count: number }>(`${this.apiUrl}/equipment-assignments`);
  }

  // Create equipment assignment
  createAssignment(payload: CheckoutPayload & { bookingEventId?: string }): Observable<{ success: boolean; assignment: any }> {
    return this.http.post<{ success: boolean; assignment: any }>(`${this.apiUrl}/equipment-assignments`, {
      equipment_id: payload.equipmentId,
      booking_event_id: payload.bookingEventId,
      staff_id: payload.staffId,
      assigned_at: new Date().toISOString(),
      returned_at: payload.expectedReturnDate,
      status: 'assigned',
      notes: payload.notes
    });
  }

  // Get booking events for assignment
  getBookingEvents(): Observable<{ success: boolean; events: any[]; count: number }> {
    return this.http.get<{ success: boolean; events: any[]; count: number }>(`${this.apiUrl}/booking-events`);
  }

  // Get staff members for checkout from User Management
  getStaff(): Observable<{ success: boolean; users?: any[]; staff?: any[]; count: number }> {
    return this.http.get<{ success: boolean; users?: any[]; staff?: any[]; count: number }>(`${this.apiUrl}/users`);
  }

  // Return equipment and close active assignment
  returnEquipment(equipmentId: string): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.apiUrl}/equipment-assignments/return-by-equipment/${equipmentId}`, {});
  }

  // Update assignment (for returns)
  updateAssignment(id: string, status: 'returned' | 'lost' | 'damaged', returnedAt?: string): Observable<{ success: boolean; assignment: any }> {
    return this.http.put<{ success: boolean; assignment: any }>(`${this.apiUrl}/equipment-assignments/${id}`, {
      status,
      returned_at: returnedAt || new Date().toISOString()
    });
  }

  // Map database equipment to frontend format
  mapToEquipmentFormat(dbEquipment: any): EquipmentItem {
    return {
      id: dbEquipment.id,
      name: dbEquipment.name,
      type: dbEquipment.equipment_type as EquipmentType,
      typeLabel: this.mapTypeToLabel(dbEquipment.equipment_type),
      idNumber: dbEquipment.serial_number,
      status: dbEquipment.status as EquipmentStatus,
      checkedOutWith: dbEquipment.checked_out_with || undefined,
      checkedOutSince: dbEquipment.checked_out_since ? new Date(dbEquipment.checked_out_since) : undefined,
      checkedOutDue: dbEquipment.checked_out_due ? new Date(dbEquipment.checked_out_due) : undefined,
      purchaseDate: dbEquipment.purchase_date,
      purchasePrice: dbEquipment.purchase_price,
      notes: dbEquipment.notes
    };
  }

  // Map equipment type to display label
  mapTypeToLabel(type: string): string {
    const typeMap: { [key: string]: string } = {
      'camera': 'Camera',
      'drone': 'Drone',
      'memory_card': 'Memory Card',
      'hard_disk': 'Hard Disk',
      'lens': 'Lens',
      'tripod': 'Tripod',
      'light': 'Light',
      'other': 'Other'
    };
    return typeMap[type] || 'Other';
  }

  // Map label to equipment type
  mapLabelToType(label: string): EquipmentType {
    const labelMap: { [key: string]: EquipmentType } = {
      'Camera': 'camera',
      'Drone': 'drone',
      'Memory Card': 'memory_card',
      'Hard Disk': 'hard_disk',
      'Lens': 'lens',
      'Tripod': 'tripod',
      'Light': 'light',
      'Other': 'other'
    };
    return labelMap[label] || 'other';
  }
}