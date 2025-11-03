import request from 'supertest';
import { app } from '../index';
import { prisma } from '../config/database';

describe('Orders API', () => {
  let authToken: string;
  let businessId: string;
  let userId: string;

  beforeEach(async () => {
    // Create test user and business
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashedpassword',
        emailVerified: true,
      },
    });

    const business = await prisma.business.create({
      data: {
        name: 'Test Business',
        createdBy: user.id,
      },
    });

    await prisma.businessUser.create({
      data: {
        businessId: business.id,
        userId: user.id,
        role: 'owner',
      },
    });

    userId = user.id;
    businessId = business.id;
    
    // Mock auth token - in real tests, you'd create a proper JWT
    authToken = 'Bearer mock-token';
  });

  describe('GET /orders', () => {
    it('should return empty orders list initially', async () => {
      const response = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.orders).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should return orders with pagination', async () => {
      // Create test orders
      for (let i = 0; i < 5; i++) {
        await prisma.order.create({
          data: {
            businessId,
            orderNumber: `ORD-2024-${String(i + 1).padStart(4, '0')}`,
            subtotal: 100,
            totalAmount: 110,
            createdBy: userId,
          },
        });
      }

      const response = await request(app)
        .get('/api/v1/orders?limit=3')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.orders).toHaveLength(3);
      expect(response.body.pagination.total).toBe(5);
      expect(response.body.pagination.pages).toBe(2);
    });
  });

  describe('POST /orders', () => {
    it('should create a new order', async () => {
      const orderData = {
        items: [
          {
            productName: 'Test Product',
            quantity: 2,
            unitPrice: 50,
          },
        ],
        subtotal: 100,
        taxAmount: 10,
        totalAmount: 110,
      };

      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', authToken)
        .send(orderData)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.orderNumber).toMatch(/^ORD-/);
      expect(response.body.totalAmount).toBe(110);
      expect(response.body.status).toBe('pending');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', authToken)
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('PUT /orders/:id', () => {
    it('should update order status', async () => {
      const order = await prisma.order.create({
        data: {
          businessId,
          orderNumber: 'ORD-TEST-001',
          subtotal: 100,
          totalAmount: 110,
          createdBy: userId,
        },
      });

      const response = await request(app)
        .put(`/api/v1/orders/${order.id}`)
        .set('Authorization', authToken)
        .send({ status: 'confirmed' })
        .expect(200);

      expect(response.body.status).toBe('confirmed');
    });
  });

  describe('DELETE /orders/:id', () => {
    it('should delete pending orders', async () => {
      const order = await prisma.order.create({
        data: {
          businessId,
          orderNumber: 'ORD-TEST-001',
          subtotal: 100,
          totalAmount: 110,
          status: 'pending',
          createdBy: userId,
        },
      });

      await request(app)
        .delete(`/api/v1/orders/${order.id}`)
        .set('Authorization', authToken)
        .expect(204);

      const deletedOrder = await prisma.order.findUnique({
        where: { id: order.id },
      });
      expect(deletedOrder).toBeNull();
    });

    it('should not delete confirmed orders', async () => {
      const order = await prisma.order.create({
        data: {
          businessId,
          orderNumber: 'ORD-TEST-001',
          subtotal: 100,
          totalAmount: 110,
          status: 'confirmed',
          createdBy: userId,
        },
      });

      await request(app)
        .delete(`/api/v1/orders/${order.id}`)
        .set('Authorization', authToken)
        .expect(400);
    });
  });
});


