import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StorageFile {
  id: string;
  name: string;
  customer: string;
  bookingId: string;
  bookingNumber: string;
  sizeLabel: string;
  sizeBytes: number;
  badge: string;
  action: 'download' | 'restore';
  uploadDate: string;
  fileType: string;
  category: string;
  storagePath: string;
  status: string;
}

export interface StorageStats {
  usedBytes: number;
  usedLabel: string;
  uploadingLabel: string;
  availableLabel: string;
  totalLabel: string;
  filesCount: number;
  usagePercent: number;
}

export interface BookingOption {
  id: string;
  label: string;
  clientName: string;
}

export interface UploadFileData {
  bookingId: string;
  fileName: string;
  fileType: string;
  category: string;
  storagePath: string;
  fileSize: number;
  status: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private apiUrl = 'https://wedflow-codeflare.onrender.com/api';

  constructor(private http: HttpClient) {}

  // Get storage statistics
  getStorageStats(): Observable<StorageStats> {
    return this.http.get<StorageStats>(`${this.apiUrl}/storage/stats`);
  }

  // Get all files with optional filtering
  getFiles(filters?: {
    searchTerm?: string;
    category?: string;
    status?: string;
  }): Observable<{ success: boolean; files: StorageFile[]; count: number }> {
    const params: any = {};
    if (filters?.searchTerm) params.search = filters.searchTerm;
    if (filters?.category) params.category = filters.category;
    if (filters?.status) params.status = filters.status;

    return this.http.get<{ success: boolean; files: StorageFile[]; count: number }>(
      `${this.apiUrl}/files/enhanced`,
      { params }
    );
  }

  // Get booking options for upload form
  getBookingOptions(): Observable<{ success: boolean; bookings: any[] }> {
    return this.http.get<{ success: boolean; bookings: any[] }>(`${this.apiUrl}/bookings`);
  }

  // Upload file
  uploadFile(fileData: UploadFileData, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('booking_id', fileData.bookingId);
    formData.append('file_name', fileData.fileName);
    formData.append('file_type', fileData.fileType);
    formData.append('category', fileData.category);
    formData.append('storage_path', fileData.storagePath);
    formData.append('file_size', fileData.fileSize.toString());
    formData.append('status', fileData.status);
    if (fileData.notes) formData.append('notes', fileData.notes);
    
    // Note: The backend currently doesn't handle multipart form data properly
    // For now, we'll send the metadata as JSON and skip the actual file upload
    // In production, you'd need to configure multer or similar middleware
    
    return this.http.post(`${this.apiUrl}/files/upload`, {
      booking_id: fileData.bookingId,
      file_name: fileData.fileName,
      file_type: fileData.fileType,
      category: fileData.category,
      storage_path: fileData.storagePath,
      file_size: fileData.fileSize,
      status: fileData.status,
      notes: fileData.notes
    });
  }

  // Download file
  downloadFile(fileId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/files/${fileId}/download`, {
      responseType: 'blob'
    });
  }

  // Restore file from archive
  restoreFile(fileId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/files/${fileId}/restore`, {});
  }

  // Archive file
  archiveFile(fileId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/files/${fileId}/archive`, {});
  }

  // Delete file
  deleteFile(fileId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/files/${fileId}`);
  }

  // Get storage categories
  getStorageCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/storage-categories`);
  }

  // Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Map database file to frontend StorageFile format
  mapToFileFormat(dbFile: any, bookingNumber: string, clientName: string): StorageFile {
    const isArchived = dbFile.status === 'archived';
    return {
      id: dbFile.id,
      name: dbFile.file_name,
      customer: clientName,
      bookingId: dbFile.booking_id,
      bookingNumber: bookingNumber,
      sizeLabel: this.formatFileSize(dbFile.file_size || 0),
      sizeBytes: dbFile.file_size || 0,
      badge: isArchived ? 'Deep Archive' : this.mapCategoryToBadge(dbFile.category),
      action: isArchived ? 'restore' : 'download',
      uploadDate: dbFile.upload_date,
      fileType: dbFile.file_type,
      category: dbFile.category,
      storagePath: dbFile.storage_path,
      status: dbFile.status
    };
  }

  private mapCategoryToBadge(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'raw': 'Raw',
      'edited': 'Edited', 
      'album': 'Album',
      'final': 'Final',
      'other': 'Other',
      'general': 'Other'
    };
    return categoryMap[category?.toLowerCase()] || 'Other';
  }
}
