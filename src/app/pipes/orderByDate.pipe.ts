import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'orderByDate'
})
export class OrderByDatePipe implements PipeTransform {
  transform(array: any[], property: string): any[] {
    if (!array || !property) {
      return array;
    }

    const sortedArray = array.slice().sort((a, b) => {
      const dateA = new Date(a[property]);
      const dateB = new Date(b[property]);

      return dateA.getTime() - dateB.getTime();
    });

    return sortedArray.reverse();
  }
}
