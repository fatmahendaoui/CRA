import { AfterViewInit, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  template: '',
})
export abstract class AbstractTableComponent<T> implements OnInit, OnChanges, AfterViewInit {
  @ViewChild(MatPaginator, { static: true })
  public paginator: MatPaginator;

  @ViewChild(MatSort, { static: true })
  public sort: MatSort;

  @Input()
  public data: any;

  @Input()
  public filter: string = '';

  @Input()
  public displayedColumns: string[];

  @Output()
  public rowClicked = new EventEmitter<T>();

  public dataSource: MatTableDataSource<T>;

  public readonly page = 1;
  public readonly pageSize = 10;

  public ngOnInit(): void {    
    this.dataSource = new MatTableDataSource(this.data ?? []);
    this.dataSource.filter = this.filter;
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['filter'] && this.dataSource) {
      this.dataSource.filter = changes['filter'].currentValue.trim().toLowerCase();;
    }
  }

  public ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  public handleRowCliked(row: T): void {
    this.rowClicked.emit(row);
  }
}