# 🎨 Enhanced Purchases API Documentation

## Overview
The Purchases API has been significantly enhanced to provide richer data for building a premium admin panel with beautiful dark mode support. The API now includes comprehensive statistics, trends, and analytics data.

---

## 🚀 Enhanced Endpoints

### 1. **GET /api/purchases** (Admin Only)
Get all purchases with advanced filtering and rich statistics.

#### Enhanced Response Structure
```json
{
  "success": true,
  "message": "Purchases retrieved successfully",
  "data": [
    {
      "_id": "purchase_id",
      "user": {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "profileImage": "https://...",
        "role": "user"
      },
      "purchaseType": "subscription",
      "pricingPlan": {
        "_id": "plan_id",
        "name": "Premium Plan",
        "duration": "1 month",
        "price": 29.99,
        "finalPrice": 24.99,
        "maxDownloads": 100,
        "features": ["Feature 1", "Feature 2"]
      },
      "amount": 24.99,
      "currency": "USD",
      "status": "completed",
      "paymentMethod": "stripe",
      "purchaseDate": "2025-11-12T10:30:00.000Z",
      "subscriptionStartDate": "2025-11-12T10:30:00.000Z",
      "subscriptionEndDate": "2025-12-12T10:30:00.000Z",
      "remainingDownloads": 95
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 100,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "statistics": {
    "revenue": {
      "total": 24599.50,
      "average": 245.99,
      "highest": 999.00,
      "lowest": 9.99
    },
    "breakdown": {
      "byStatus": [
        { "_id": "completed", "count": 75, "totalAmount": 18450 },
        { "_id": "pending", "count": 20, "totalAmount": 4900 },
        { "_id": "cancelled", "count": 5, "totalAmount": 1249.50 }
      ],
      "byType": [
        { "_id": "subscription", "count": 60, "totalAmount": 14994 },
        { "_id": "individual", "count": 40, "totalAmount": 9605.50 }
      ],
      "byPaymentMethod": [
        { "_id": "stripe", "count": 85, "totalAmount": 20909.50 },
        { "_id": "paypal", "count": 15, "totalAmount": 3690 }
      ]
    },
    "trends": {
      "last7Days": [
        { "_id": "2025-11-06", "count": 12, "revenue": 2940 },
        { "_id": "2025-11-07", "count": 15, "revenue": 3690 },
        { "_id": "2025-11-08", "count": 18, "revenue": 4428 }
      ]
    },
    "topCustomers": [
      {
        "userId": "user_id",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "totalSpent": 1299.95,
        "purchaseCount": 12
      }
    ]
  },
  "filters": {
    "status": "completed",
    "paymentMethod": null,
    "purchaseType": null,
    "amountRange": { "min": null, "max": null },
    "dateRange": { "start": null, "end": null },
    "search": null
  }
}
```

#### Query Parameters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | number | Page number | `1` |
| `limit` | number | Items per page | `10` |
| `sortBy` | string | Sort field | `createdAt`, `amount`, `status` |
| `sortOrder` | string | Sort direction | `asc`, `desc` |
| `status` | string | Filter by status | `completed`, `pending`, `cancelled` |
| `paymentMethod` | string | Filter by payment method | `stripe`, `paypal` |
| `purchaseType` | string | Filter by type | `individual`, `subscription` |
| `minAmount` | number | Minimum amount | `10.00` |
| `maxAmount` | number | Maximum amount | `1000.00` |
| `startDate` | ISO date | Date range start | `2025-11-01` |
| `endDate` | ISO date | Date range end | `2025-11-30` |
| `search` | string | Search in user name/email | `john` |

---

### 2. **GET /api/purchases/analytics** (Admin Only)
Get comprehensive purchase analytics with trends and metrics.

#### Enhanced Response Structure
```json
{
  "success": true,
  "message": "Purchase analytics retrieved successfully",
  "data": {
    "summary": {
      "totalPurchases": 1250,
      "totalRevenue": 124599.50,
      "completedPurchases": 980,
      "pendingPurchases": 180,
      "cancelledPurchases": 70,
      "refundedPurchases": 20,
      "averageOrderValue": 99.68,
      "maxOrderValue": 999.00,
      "minOrderValue": 4.99,
      "uniqueCustomers": 456,
      "conversionRate": 78.4
    },
    "breakdowns": {
      "status": [
        { "_id": "completed", "count": 980, "totalAmount": 97500.20 },
        { "_id": "pending", "count": 180, "totalAmount": 17940.80 }
      ],
      "paymentMethod": [
        {
          "_id": "stripe",
          "count": 1050,
          "totalAmount": 104509.75,
          "averageAmount": 99.53
        },
        {
          "_id": "paypal",
          "count": 200,
          "totalAmount": 20089.75,
          "averageAmount": 100.45
        }
      ],
      "purchaseType": [
        {
          "_id": "subscription",
          "count": 750,
          "totalRevenue": 74624.25,
          "averageValue": 99.50
        },
        {
          "_id": "individual",
          "count": 500,
          "totalRevenue": 49975.25,
          "averageValue": 99.95
        }
      ],
      "currency": [
        { "_id": "USD", "count": 1100, "totalAmount": 109529.50 },
        { "_id": "EUR", "count": 100, "totalAmount": 9950.00 },
        { "_id": "BDT", "count": 50, "totalAmount": 5120.00 }
      ]
    },
    "topPerformers": {
      "plans": [
        {
          "planId": "plan_id",
          "planName": "Premium Annual",
          "planDuration": "1 year",
          "subscriptionCount": 245,
          "totalRevenue": 24255.00,
          "averageRevenue": 99.00
        }
      ],
      "designs": [
        {
          "designId": "design_id",
          "designTitle": "Modern Logo Pack",
          "purchaseCount": 156,
          "totalRevenue": 15444.00,
          "averagePrice": 99.00
        }
      ]
    },
    "trends": {
      "revenue": [
        {
          "date": "2025-11-01",
          "revenue": 4250.50,
          "orders": 45,
          "completedOrders": 38,
          "averageOrderValue": 94.46
        },
        {
          "date": "2025-11-02",
          "revenue": 5120.75,
          "orders": 52,
          "completedOrders": 48,
          "averageOrderValue": 98.48
        }
      ]
    },
    "subscriptions": {
      "activeSubscriptions": 425,
      "monthlyRecurringRevenue": 42250.00,
      "averageSubscriptionValue": 99.41
    },
    "metadata": {
      "period": "monthly",
      "dateRange": {
        "start": "2025-10-12T00:00:00.000Z",
        "end": "2025-11-12T23:59:59.999Z"
      },
      "generatedAt": "2025-11-12T10:30:00.000Z"
    }
  }
}
```

#### Query Parameters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `period` | string | Time period | `daily`, `weekly`, `monthly`, `yearly` |
| `startDate` | ISO date | Custom date range start | `2025-11-01` |
| `endDate` | ISO date | Custom date range end | `2025-11-30` |

---

## 🎨 Frontend UI Recommendations for Dark Mode

### Color Palette Suggestions
```css
/* Dark Mode Colors */
:root[data-theme="dark"] {
  /* Background */
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  
  /* Accent Colors */
  --accent-success: #10b981;
  --accent-warning: #f59e0b;
  --accent-danger: #ef4444;
  --accent-info: #3b82f6;
  --accent-primary: #8b5cf6;
  
  /* Text */
  --text-primary: #f1f5f9;
  --text-secondary: #cbd5e1;
  --text-muted: #94a3b8;
  
  /* Borders */
  --border-color: #334155;
  --border-hover: #475569;
  
  /* Cards */
  --card-bg: #1e293b;
  --card-hover: #334155;
}
```

### Dashboard Widgets to Build

#### 1. **Revenue Cards** (Top Row)
- Total Revenue (with trend indicator)
- Average Order Value
- Conversion Rate
- Active Subscriptions

#### 2. **Charts**
- **Line Chart**: Revenue trend over time
- **Donut Chart**: Purchase type breakdown
- **Bar Chart**: Top performing plans/designs
- **Area Chart**: Daily orders vs completed orders

#### 3. **Data Tables**
- Recent purchases with status badges
- Top customers with spending info
- Sortable and filterable columns

#### 4. **Status Badges**
```json
{
  "completed": "green",
  "pending": "yellow",
  "cancelled": "red",
  "refunded": "orange"
}
```

---

## 📊 Chart.js / Recharts Integration Examples

### Revenue Trend Chart Data
```javascript
const chartData = response.data.trends.revenue.map(item => ({
  date: item.date,
  revenue: item.revenue,
  orders: item.orders,
  averageOrderValue: item.averageOrderValue
}));
```

### Status Breakdown Pie Chart
```javascript
const statusData = response.data.breakdowns.status.map(item => ({
  name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
  value: item.count,
  amount: item.totalAmount
}));
```

---

## 🔥 Premium Features Included

✅ **Real-time Statistics** - Live updates of key metrics
✅ **Trend Analysis** - 7-day revenue trends
✅ **Customer Insights** - Top spending customers
✅ **Performance Metrics** - Conversion rates, AOV
✅ **MRR Tracking** - Monthly Recurring Revenue
✅ **Multi-currency Support** - Currency breakdown
✅ **Advanced Filtering** - By status, date, amount, etc.
✅ **Export Ready** - All data structured for CSV/PDF export
✅ **Responsive Data** - Optimized for charts and graphs

---

## 🎯 Usage Examples

### Fetch All Purchases with Statistics
```javascript
const response = await fetch('/api/purchases?page=1&limit=20&status=completed', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();

// Access statistics
console.log('Total Revenue:', data.statistics.revenue.total);
console.log('Top Customer:', data.statistics.topCustomers[0]);
```

### Fetch Analytics
```javascript
const response = await fetch('/api/purchases/analytics?period=monthly', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const analytics = await response.json();

// Use for dashboard
console.log('Conversion Rate:', analytics.data.summary.conversionRate);
console.log('MRR:', analytics.data.subscriptions.monthlyRecurringRevenue);
```

---

## 🚀 Next Steps

1. **Build Dashboard Components** - Use the statistics data to create widgets
2. **Add Charts** - Integrate Chart.js or Recharts with trend data
3. **Implement Filters** - Create filter UI using the query parameters
4. **Add Export** - Use the data for CSV/PDF generation
5. **Real-time Updates** - Consider WebSocket for live statistics

---

## 📞 Support

For questions or issues, contact the backend team or refer to the main API documentation.

**API Base URL**: `https://lz-fly-backend.vercel.app/api`
**Frontend URL**: `https://lz-fly-frontend.vercel.app`

---

**Last Updated**: November 12, 2025
**Version**: 2.0 (Enhanced for Premium Admin Panel)
