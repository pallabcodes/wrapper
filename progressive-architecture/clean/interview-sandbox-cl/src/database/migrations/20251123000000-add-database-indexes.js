'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add indexes for performance
    await queryInterface.addIndex('users', ['email'], {
      name: 'idx_users_email',
      unique: true,
    });

    await queryInterface.addIndex('users', ['role'], {
      name: 'idx_users_role',
    });

    await queryInterface.addIndex('users', ['createdAt'], {
      name: 'idx_users_created_at',
    });

    await queryInterface.addIndex('users', ['isEmailVerified'], {
      name: 'idx_users_email_verified',
    });

    // Composite index for common queries
    await queryInterface.addIndex('users', ['role', 'isEmailVerified'], {
      name: 'idx_users_role_email_verified',
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex('users', 'idx_users_email');
    await queryInterface.removeIndex('users', 'idx_users_role');
    await queryInterface.removeIndex('users', 'idx_users_created_at');
    await queryInterface.removeIndex('users', 'idx_users_email_verified');
    await queryInterface.removeIndex('users', 'idx_users_role_email_verified');
  }
};
