# SmartPOS CRM API

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication
All endpoints except `/auth/login` require Bearer token:
```
Authorization: Bearer <token>
```

## Endpoints

### Auth
- `POST /auth/login` - Login, returns JWT token

### Products
- `GET /products/` - List products
- `POST /products/` - Create product
- `GET /products/{id}` - Get product
- `PUT /products/{id}` - Update product
- `DELETE /products/{id}` - Delete product

### Sales
- `POST /sales/` - Create sale (checkout)
- `GET /sales/` - List sales
- `GET /sales/{id}/receipt` - Get receipt
- `POST /sales/{id}/refund` - Refund sale

### Customers
- `GET /customers/` - List customers
- `POST /customers/` - Create customer
- `POST /customers/{id}/loyalty-points/add` - Add points
- `POST /customers/{id}/loyalty-points/use` - Use points

### Analytics
- `GET /analytics/abc` - ABC analysis
- `GET /analytics/xyz` - XYZ analysis
- `GET /analytics/profit-margins` - Profit margins
- `GET /analytics/customer-rfm` - RFM segmentation
- `GET /analytics/sales-forecast` - Sales forecast

### Branches
- `GET /branches/` - List branches
- `POST /branches/` - Create branch
- `GET /branches/{id}/stock` - Branch stock
- `POST /branches/transfers/` - Create transfer

### Recommendations
- `GET /recommendations/products/{customer_id}` - Product suggestions
- `GET /recommendations/reorder` - Reorder suggestions
- `GET /recommendations/bundles` - Bundle suggestions

## Response Format
```json
{
  "id": 1,
  "name": "Product",
  ...
}
```

## Error Format
```json
{
  "detail": "Error message"
}
```
