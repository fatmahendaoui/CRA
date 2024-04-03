import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListcongeComponent } from './listconge.component';

describe('ListcongeComponent', () => {
  let component: ListcongeComponent;
  let fixture: ComponentFixture<ListcongeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListcongeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListcongeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
