# 🧪 Quick API Testing Guide

Test your enhanced Purchases API endpoints using these examples.

## Base URL
```
Production: https://lz-fly-backend.vercel.app
Local: http://localhost:5000
```

## Authentication
All admin endpoints require authentication. Include your JWT token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🧪 cURL Examples

### 1. Get All Purchases (with stats)
```bash
curl -X GET "https://lz-fly-backend.vercel.app/api/purchases?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Get Purchases with Filters
```bash
curl -X GET "https://lz-fly-backend.vercel.app/api/purchases?status=completed&purchaseType=subscription&startDate=2025-11-01&endDate=2025-11-30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Get Analytics
```bash
curl -X GET "https://lz-fly-backend.vercel.app/api/purchases/analytics?period=monthly" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Get Analytics with Custom Date Range
```bash
curl -X GET "https://lz-fly-backend.vercel.app/api/purchases/analytics?startDate=2025-11-01&endDate=2025-11-30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🧪 JavaScript/TypeScript Examples

### Using Fetch API
```typescript
// Get all purchases with statistics
async function getPurchases() {
  const response = await fetch('https://lz-fly-backend.vercel.app/api/purchases?page=1&limit=20', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Purchases:', data.data);
    console.log('Statistics:', data.statistics);
    console.log('Total Revenue:', data.statistics.revenue.total);
  }
}

// Get analytics
async function getAnalytics(period = 'monthly') {
  const response = await fetch(`https://lz-fly-backend.vercel.app/api/purchases/analytics?period=${period}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Summary:', data.data.summary);
    console.log('Conversion Rate:', data.data.summary.conversionRate);
    console.log('MRR:', data.data.subscriptions.monthlyRecurringRevenue);
  }
}
```

### Using Axios
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://lz-fly-backend.vercel.app/api',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

// Get purchases with filters
async function getFilteredPurchases(filters) {
  try {
    const { data } = await api.get('/purchases', { params: filters });
    return data;
  } catch (error) {
    console.error('Error fetching purchases:', error);
  }
}

// Example usage
const data = await getFilteredPurchases({
  page: 1,
  limit: 20,
  status: 'completed',
  startDate: '2025-11-01',
  endDate: '2025-11-30'
});
```

---

## 🧪 Postman Collection

### Get All Purchases
```
GET {{base_url}}/purchases
Headers:
  Authorization: Bearer {{token}}
Query Params:
  page: 1
  limit: 20
  sortBy: createdAt
  sortOrder: desc
  status: completed
```

### Get Analytics
```
GET {{base_url}}/purchases/analytics
Headers:
  Authorization: Bearer {{token}}
Query Params:
  period: monthly
```

---

## 📊 Expected Response Times

| Endpoint | Expected Time | Data Size |
|----------|--------------|-----------|
| GET /purchases | 100-300ms | ~50KB |
| GET /purchases/analytics | 200-500ms | ~20KB |
| GET /purchases (with filters) | 150-400ms | ~30-100KB |

---

## 🔍 Response Validation Checklist

### ✅ GET /purchases
- [ ] `success` is `true`
- [ ] `data` is an array
- [ ] `pagination` object exists
- [ ] `statistics` object exists
- [ ] `statistics.revenue.total` is a number
- [ ] `statistics.breakdown` contains arrays
- [ ] `statistics.topCustomers` is an array

### ✅ GET /purchases/analytics
- [ ] `success` is `true`
- [ ] `data.summary` object exists
- [ ] `data.summary.conversionRate` is present
- [ ] `data.breakdowns` object exists
- [ ] `data.trends.revenue` is an array
- [ ] `data.subscriptions` object exists
- [ ] `data.metadata` contains date range

---

## 🚨 Common Issues & Solutions

### Issue: 401 Unauthorized
**Solution**: Check if your JWT token is valid and not expired.

### Issue: Empty statistics
**Solution**: Make sure you have purchases in your database.

### Issue: Slow response
**Solution**: Use pagination and limit the date range in filters.

### Issue: CORS error
**Solution**: Make sure your frontend URL is in the CORS whitelist.

---

## 🎯 Testing Workflow

1. **Authenticate** - Get a JWT token from `/api/auth/login`
2. **Test Basic Fetch** - Get purchases without filters
3. **Test Filters** - Apply status, date, and type filters
4. **Test Analytics** - Fetch monthly analytics
5. **Test Custom Date Range** - Use startDate and endDate
6. **Verify Statistics** - Check all stat calculations
7. **Test Pagination** - Navigate through pages

---

## 📝 Sample Test Data

If you need to create test purchases, use:
```bash
POST https://lz-fly-backend.vercel.app/api/purchases
Headers:
  Authorization: Bearer YOUR_TOKEN
  Content-Type: application/json
Body:
{
  "purchaseType": "subscription",
  "pricingPlan": "PLAN_ID",
  "paymentMethod": "stripe",
  "currency": "USD"
}
```

---

**Happy Testing! 🚀**
