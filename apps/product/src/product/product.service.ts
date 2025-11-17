import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entity/product.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async createSamples() {
    const data = [
      {
        name: '사과',
        price: 10,
        description: '맛있는 정주사솨다',
        stock: 2,
      },

      {
        name: '메론',
        price: 10,
        description: '맛있는 정주사솨다',
        stock: 3,
      },

      {
        name: '수박',
        price: 11,
        description: '씨있는 수박',
        stock: 1,
      },

      {
        name: '브로 콜라',
        price: 8,
        description: '맛있는 브로 콜라',
        stock: 3,
      },

      {
        name: '바나나',
        price: 4,
        description: '맛있는 바나나',
        stock: 0,
      },
    ];
    await this.productRepository.save(data);
    return true;
  }
}
