import * as fs from 'fs';
import * as path from 'path';

export function exportToCsv(tasks: any[], filename: string): string {
  const csvContent = tasks.map(task => Object.values(task).join(',')).join('\n');
  const csvHeader = 'id,title,description,status,priority,userId,labels,createdAt,updatedAt';
  const fullCsvContent = `${csvHeader}\n${csvContent}`;
  return fullCsvContent;
}