import { randomUUID } from 'crypto';

export interface ProductProps {
    id: string;
    name: string;
    description: string;
    price: number;
    createdAt: Date;
    updatedAt: Date;
}

export class Product {
    private constructor(private readonly props: ProductProps) { }

    get id(): string { return this.props.id; }
    get name(): string { return this.props.name; }
    get description(): string { return this.props.description; }
    get price(): number { return this.props.price; }
    get createdAt(): Date { return this.props.createdAt; }
    get updatedAt(): Date { return this.props.updatedAt; }

    static create(name: string, description: string, price: number): Product {
        if (price < 0) {
            throw new Error('Price cannot be negative');
        }

        return new Product({
            id: randomUUID(),
            name,
            description,
            price,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }

    static reconstitute(props: ProductProps): Product {
        return new Product(props);
    }
}
