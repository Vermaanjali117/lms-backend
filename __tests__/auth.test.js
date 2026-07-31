require('dotenv').config({ path: '.env.test' });
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/user.model');

require('dotenv').config({ path: '.env.test' });

jest.setTimeout(30000);

// Connect DB before all tests
beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
});

// Disconnect after all tests
afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
});

describe('Auth Routes', () => {

    // Clean users before each test
    beforeEach(async () => {
        await User.deleteMany({});
    });

    describe('POST /api/auth/register', () => {

        it('should register successfully', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Anjali',
                    email: 'anjali@test.com',
                    password: '12345678'
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.email)
                .toBe('anjali@test.com');
            expect(response.body.data.password)
                .toBeUndefined();
        });

        it('should fail if email already exists', async () => {
            await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Anjali',
                    email: 'anjali@test.com',
                    password: '12345678'
                });

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Anjali',
                    email: 'anjali@test.com',
                    password: '12345678'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should fail if fields missing', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'anjali@test.com'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/login', () => {

        beforeEach(async () => {
            await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Anjali',
                    email: 'anjali@test.com',
                    password: '12345678'
                });
        });

        it('should login successfully', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'anjali@test.com',
                    password: '12345678'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.accessToken)
                .toBeDefined();
        });

        it('should fail with wrong password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'anjali@test.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should fail with wrong email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'wrong@test.com',
                    password: '12345678'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });
});