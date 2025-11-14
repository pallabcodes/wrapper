'use strict';
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Hash password for demo user
    const hashedPassword = await bcrypt.hash('demo123456', 12);

    // Create demo user
    // Note: bulkInsert doesn't return IDs reliably, so we'll query for the user
    await queryInterface.bulkInsert('users', [
      {
        email: 'demo@example.com',
        password: hashedPassword,
        name: 'Demo User',
        phone: '+1234567890',
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Get the inserted user ID
    const [users] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'demo@example.com' LIMIT 1",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const userId = users.id;

    // Create demo OTP (for testing)
    await queryInterface.bulkInsert('otps', [
      {
        userId: userId,
        code: '123456',
        type: 'VERIFY',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        createdAt: new Date(),
      },
    ]);

    // Create demo payment
    await queryInterface.bulkInsert('payments', [
      {
        userId: userId,
        amount: 99.99,
        currency: 'USD',
        status: 'COMPLETED',
        transactionId: 'demo_txn_123456',
        createdAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    // Remove demo data
    await queryInterface.bulkDelete('payments', { transactionId: 'demo_txn_123456' });
    await queryInterface.bulkDelete('otps', { code: '123456' });
    await queryInterface.bulkDelete('users', { email: 'demo@example.com' });
  },
};

