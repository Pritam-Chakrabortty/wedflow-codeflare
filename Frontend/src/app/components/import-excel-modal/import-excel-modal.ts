import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-import-excel-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './import-excel-modal.html',
  styleUrl: './import-excel-modal.scss',
})
export class ImportExcelModal {
  @Input() isOpen = false;
  @Input() entityName = 'Bookings'; // 'Bookings' | 'Clients'
  @Input() columns: string[] = [];
  @Input() sampleRows: string[][] = [];

  @Output() close = new EventEmitter<void>();
  @Output() fileImported = new EventEmitter<File>();

  selectedFile: File | null = null;
  errorMessage = '';
  isProcessing = false;

  onClose(): void {
    this.selectedFile = null;
    this.errorMessage = '';
    this.close.emit();
  }

  downloadTemplate(): void {
    if (!this.columns || this.columns.length === 0) return;

    // Build CSV content
    const escapeCsv = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;
    const headerRow = this.columns.map(escapeCsv).join(',');
    const sampleDataRows = (this.sampleRows || []).map((row) =>
      row.map(escapeCsv).join(',')
    );

    const csvContent = [headerRow, ...sampleDataRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${this.entityName.toLowerCase()}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.validateAndSetFile(file);
    }
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.validateAndSetFile(file);
    }
  }

  private validateAndSetFile(file: File): void {
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      this.errorMessage = 'Please select a valid CSV or Excel file (.csv, .xlsx, .xls).';
      this.selectedFile = null;
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.errorMessage = 'File size exceeds 10MB limit.';
      this.selectedFile = null;
      return;
    }

    this.errorMessage = '';
    this.selectedFile = file;
  }

  removeSelectedFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile = null;
    this.errorMessage = '';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  onImportSubmit(): void {
    if (!this.selectedFile) return;
    this.fileImported.emit(this.selectedFile);
    this.onClose();
  }
}

