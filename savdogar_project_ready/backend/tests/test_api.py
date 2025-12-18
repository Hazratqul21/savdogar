"""API endpoint tests."""


def test_health_check(client):
    """Test health endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_root(client):
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200


def test_login_success(client, auth_headers):
    """Test successful login."""
    assert "Authorization" in auth_headers


def test_login_fail(client):
    """Test failed login."""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "wrong", "password": "wrong"}
    )
    assert response.status_code == 401


def test_get_current_user(client, auth_headers):
    """Test get current user."""
    response = client.get("/api/v1/users/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["username"] == "testuser"


def test_products_list(client, auth_headers):
    """Test products listing."""
    response = client.get("/api/v1/products/", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_product(client, auth_headers):
    """Test product creation."""
    # First create a category
    cat_response = client.post(
        "/api/v1/categories/",
        headers=auth_headers,
        json={"name": "Test Category"}
    )
    assert cat_response.status_code == 200
    category_id = cat_response.json()["id"]
    
    # Create product
    response = client.post(
        "/api/v1/products/",
        headers=auth_headers,
        json={
            "name": "Test Product",
            "price": 10000,
            "cost_price": 8000,
            "stock_quantity": 100,
            "category_id": category_id,
            "unit": "dona"
        }
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Test Product"


def test_dashboard_stats(client, auth_headers):
    """Test dashboard stats endpoint."""
    response = client.get("/api/v1/dashboard/stats", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "today_sales" in data
    assert "total_products" in data


def test_customers_list(client, auth_headers):
    """Test customers listing."""
    response = client.get("/api/v1/customers/", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_customer(client, auth_headers):
    """Test customer creation."""
    response = client.post(
        "/api/v1/customers/",
        headers=auth_headers,
        json={
            "name": "Test Customer",
            "phone": "+998901234567"
        }
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Test Customer"
