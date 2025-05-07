import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerHorariosComponent } from './ver-horarios.component';

describe('VerHorariosComponent', () => {
  let component: VerHorariosComponent;
  let fixture: ComponentFixture<VerHorariosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VerHorariosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerHorariosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
