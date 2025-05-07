import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerHorariosDocentesComponent } from './ver-horarios-docentes.component';

describe('VerHorariosDocentesComponent', () => {
  let component: VerHorariosDocentesComponent;
  let fixture: ComponentFixture<VerHorariosDocentesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VerHorariosDocentesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerHorariosDocentesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
