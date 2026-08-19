import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';

const mockProduct = {
  id: 1,
  title: 'T-shirt',
  price: 20,
  description: 'desc',
  category: 'clothing',
  image: 'img.jpg',
  rating: { rate: 4, count: 10 },
};

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add a new product to the cart', () => {
    service.add(mockProduct);
    expect(service.cartItems().length).toBe(1);
    expect(service.cartItems()[0].quantity).toBe(1);
  });

  it('should increase quantity when adding the same product twice', () => {
    service.add(mockProduct);
    service.add(mockProduct);
    expect(service.cartItems().length).toBe(1);
    expect(service.cartItems()[0].quantity).toBe(2);
  });

  it('should compute the total price correctly', () => {
    service.add(mockProduct);
    service.add(mockProduct);
    expect(service.total()).toBe(40);
  });

  it('should compute the item count correctly', () => {
    service.add(mockProduct);
    service.add(mockProduct);
    expect(service.itemCount()).toBe(2);
  });

  it('should update the quantity of an item', () => {
    service.add(mockProduct);
    service.updateQuantity(1, 5);
    expect(service.cartItems()[0].quantity).toBe(5);
  });

  it('should remove an item when its quantity is set to 0 or less', () => {
    service.add(mockProduct);
    service.updateQuantity(1, 0);
    expect(service.cartItems().length).toBe(0);
  });

  it('should remove an item explicitly', () => {
    service.add(mockProduct);
    service.remove(1);
    expect(service.cartItems().length).toBe(0);
  });

  it('should clear the cart', () => {
    service.add(mockProduct);
    service.clear();
    expect(service.cartItems().length).toBe(0);
  });
});