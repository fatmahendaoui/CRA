import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailscongeComponent } from './detailsconge.component';

describe('DetailscongeComponent', () => {
  let component: DetailscongeComponent;
  let fixture: ComponentFixture<DetailscongeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailscongeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailscongeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
