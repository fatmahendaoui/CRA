import { Directive, ElementRef, Input, Renderer2, Output, EventEmitter } from '@angular/core';

@Directive({
  selector: '[appDisableWeekends]'
})
export class DisableWeekendsDirective {
  @Input() appDisableWeekends: string; // Input to indicate whether the day should be disabled
  @Output() weekendStateChanged = new EventEmitter<boolean>(); // Emit the weekend state

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges() {


    const isWeekend = this.isWeekendDay(); // Check if the current day is a weekend
    this.weekendStateChanged.emit(isWeekend); // Emit the weekend state

  }

  private isWeekendDay(): boolean {
    const dayName = this.appDisableWeekends
    return dayName === 'Sat' || dayName === 'Sun';
  }
}
