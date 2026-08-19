import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { Catalog } from './catalog';
import { CartService } from '../../core/services/cart.service';

const mockProducts = [
  { id: 1, title: 'A', price: 10, description: '', category: 'clothing', image: '', rating: { rate: 4, count: 1 } },
  { id: 2, title: 'B', price: 20, description: '', category: 'electronics', image: '', rating: { rate: 4, count: 1 } },
];

describe('Catalog', () => {
  let component: Catalog;
  let fixture: ComponentFixture<Catalog>;
  let httpMock: HttpTestingController;
  let cartService: CartService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Catalog],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Catalog);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    cartService = TestBed.inject(CartService);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    httpMock.expectOne('https://fakestoreapi.com/products').flush([]);
    httpMock.expectOne('https://fakestoreapi.com/products/categories').flush([]);
  });

  it('should filter products by category', () => {
    httpMock.expectOne('https://fakestoreapi.com/products').flush(mockProducts);
    httpMock.expectOne('https://fakestoreapi.com/products/categories').flush(['clothing', 'electronics']);

    component.selectCategory('electronics');
    expect(component.selectedCategory()).toBe('electronics');
    expect(component.filteredProducts().length).toBe(1);
    expect(component.filteredProducts()[0].category).toBe('electronics');
  });

  it('should show all products when category is "all"', () => {
    httpMock.expectOne('https://fakestoreapi.com/products').flush(mockProducts);
    httpMock.expectOne('https://fakestoreapi.com/products/categories').flush([]);

    component.selectCategory('all');
    expect(component.filteredProducts().length).toBe(2);
  });

  it('should add a product to the cart', () => {
    httpMock.expectOne('https://fakestoreapi.com/products').flush(mockProducts);
    httpMock.expectOne('https://fakestoreapi.com/products/categories').flush([]);

    component.addToCart(mockProducts[0]);
    expect(cartService.itemCount()).toBe(1);
  });

  it('should set an error when the products request fails', () => {
    httpMock.expectOne('https://fakestoreapi.com/products').flush(
      { message: 'error' },
      { status: 500, statusText: 'Server Error' }
    );
    httpMock.expectOne('https://fakestoreapi.com/products/categories').flush([]);

    expect(component.error()).toBeTruthy();
    expect(component.loading()).toBe(false);
  });
});