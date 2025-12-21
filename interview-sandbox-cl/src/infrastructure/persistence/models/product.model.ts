import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    CreatedAt,
    UpdatedAt,
} from 'sequelize-typescript';

@Table({
    tableName: 'products',
    timestamps: true,
})
export class ProductModel extends Model<ProductModel> {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        allowNull: false,
    })
    declare id: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    name: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    description: string;

    @Column({
        type: DataType.FLOAT,
        allowNull: false,
    })
    price: number;

    @CreatedAt
    declare createdAt: Date;

    @UpdatedAt
    declare updatedAt: Date;
}
