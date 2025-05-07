import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionarAulasComponent } from './gestionar-aulas.component';

describe('GestionarAulasComponent', () => {
  let component: GestionarAulasComponent;
  let fixture: ComponentFixture<GestionarAulasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GestionarAulasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionarAulasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
