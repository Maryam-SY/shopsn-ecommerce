import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Cart } from './cart';
import { CartService } from '../../core/services/cart.service';

const mockProduct = {
  id: 1,
  title: 'T-shirt',
  price: 20,
  description: 'desc',
  category: 'clothing',
  image: 'img.jpg',
  rating: { rate: 4, count: 10 },
};

describe('Cart', () => {
  let component: Cart;
  let fixture: ComponentFixture<Cart>;
  let cartService: CartService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cart],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Cart);
    component = fixture.componentInstance;
    cartService = TestBed.inject(CartService);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show empty cart message when there are no items', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.status')?.textContent).toContain('vide');
  });

  it('should increase item quantity', () => {
    cartService.add(mockProduct);
    component.increase(1, 1);
    expect(cartService.cartItems()[0].quantity).toBe(2);
  });

  it('should decrease item quantity', () => {
    cartService.add(mockProduct);
    cartService.add(mockProduct);
    component.decrease(1, 2);
    expect(cartService.cartItems()[0].quantity).toBe(1);
  });

  it('should remove item from cart', () => {
    cartService.add(mockProduct);
    component.remove(1);
    expect(cartService.cartItems().length).toBe(0);
  });
});