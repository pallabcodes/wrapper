'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');
    const idCol = table?.id;

    if (idCol && idCol.type?.includes('UUID')) {
      // Already migrated; skip id change
    } else {
    await queryInterface.changeColumn('users', 'id', {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      allowNull: false,
      primaryKey: true,
    });
    }

    if (!table?.isActive) {
    await queryInterface.addColumn('users', 'isActive', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    });
    }
  },

  async down (queryInterface, Sequelize) {
    // Remove isActive column
    await queryInterface.removeColumn('users', 'isActive');

    // Note: Reverting UUID to INTEGER is complex and may lose data
    // This is a simplified revert - in production you'd need a proper strategy
    await queryInterface.changeColumn('users', 'id', {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    });
  }
};
