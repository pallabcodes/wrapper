import { productService } from "../../modules/product/productService"

describe("Product Integration Tests", () => {
  it("should create a new product", async () => {
    const productData = {
      name: "Test Product",
      description: "A test product",
      price: 99.99,
      currency: "USD",
      sku: "TEST-001",
      category: "Electronics",
      stockQuantity: 100
    }

    const result = await productService.createProduct(productData)
    
    expect(result).toMatchObject({
      name: productData.name,
      description: productData.description,
      price: productData.price,
      currency: productData.currency,
      sku: productData.sku,
      category: productData.category,
      stockQuantity: productData.stockQuantity
    })
  })

  it("should get product by ID", async () => {
    const productData = {
      name: "Test Product 2",
      description: "Another test product",
      price: 149.99,
      currency: "USD",
      sku: "TEST-002",
      category: "Electronics",
      stockQuantity: 50
    }

    const created = await productService.createProduct(productData)
    const result = await productService.getProductById(created.id)
    
    expect(result).toMatchObject({
      id: created.id,
      name: productData.name,
      sku: productData.sku,
      price: productData.price,
      currency: productData.currency
    })
  })

  it("should handle duplicate SKU", async () => {
    const productData = {
      name: "Test Product 3",
      description: "A test product",
      price: 99.99,
      currency: "USD",
      sku: "TEST-003",
      category: "Electronics",
      stockQuantity: 100
    }

    // Create first product
    await productService.createProduct(productData)

    // Try to create product with same SKU
    await expect(productService.createProduct(productData)).rejects.toThrow("Product with this SKU already exists")
  })
})
