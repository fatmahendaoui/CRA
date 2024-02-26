import { Injectable } from '@angular/core';
import { DaysOfWeek } from '../models/dates.constants' ;  // Adjust the path

@Injectable({
  providedIn: 'root'
})
export class DateService {
  // Utility methods for date calculations

  getDaysInMonth(month: number, year: number): number {
    return new Date(year, month, 0).getDate();
  }

  getNameDate(year: number, month: number, day: number): string {
    const date = new Date(year, month, day);
    return DaysOfWeek[date.getDay()];
  }

  getCurrentDate(): Date {
    return new Date();
  }
}
