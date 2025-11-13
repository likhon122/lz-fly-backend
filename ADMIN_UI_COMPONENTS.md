# 🎨 Admin Panel UI Component Guide

## Premium Dark Mode Dashboard for Purchases

This guide provides UI component suggestions and data mapping for building a beautiful dark mode admin panel.

---

## 📊 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Header: "Purchases Dashboard"                              │
├─────────────┬─────────────┬─────────────┬──────────────────┤
│ Total Revenue│  Avg Order  │ Conversion  │Active Subs       │
│  $124,599   │    $99.68   │   78.4%     │  425             │
│  📈 +12.5%  │  📈 +5.2%   │  📉 -2.1%   │  📈 +8.7%        │
└─────────────┴─────────────┴─────────────┴──────────────────┘

┌────────────────────────────┬──────────────────────────────────┐
│  Revenue Trend (Line Chart)│  Status Breakdown (Donut Chart)  │
│                            │                                  │
│  [Chart showing daily      │  [Chart showing:                 │
│   revenue over time]       │   - Completed: 78%               │
│                            │   - Pending: 14%                 │
│                            │   - Cancelled: 6%                │
│                            │   - Refunded: 2%]                │
└────────────────────────────┴──────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  Recent Purchases Table                                       │
│  [Filters: Status, Type, Date Range, Search]                  │
│                                                               │
│  User | Type | Amount | Status | Date | Actions              │
│  ─────────────────────────────────────────────────────       │
│  John | Sub  | $99.00 | ✓ Done| Nov 12| [View][Edit]        │
│  Jane | Ind  | $49.99 | ⏳ Pend| Nov 12| [View][Edit]        │
└───────────────────────────────────────────────────────────────┘

┌────────────────────────────┬──────────────────────────────────┐
│  Top Customers             │  Top Products                    │
│                            │                                  │
│  1. Jane S. - $1,299.95   │  1. Premium Annual - $24,255     │
│  2. John D. - $899.50     │  2. Modern Logo Pack - $15,444   │
│  3. Mike T. - $750.00     │  3. UI Kit Bundle - $12,890      │
└────────────────────────────┴──────────────────────────────────┘
```

---

## 🎨 Component Examples

### 1. Stat Card Component

```typescript
interface StatCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon: ReactNode;
  color: 'success' | 'warning' | 'danger' | 'info' | 'primary';
}

// Usage with API data
const statsData = [
  {
    title: 'Total Revenue',
    value: `$${data.statistics.revenue.total.toLocaleString()}`,
    trend: { value: 12.5, isPositive: true },
    icon: <DollarIcon />,
    color: 'success'
  },
  {
    title: 'Average Order Value',
    value: `$${data.statistics.revenue.average.toFixed(2)}`,
    trend: { value: 5.2, isPositive: true },
    icon: <ChartIcon />,
    color: 'info'
  },
  {
    title: 'Conversion Rate',
    value: `${analytics.data.summary.conversionRate.toFixed(1)}%`,
    trend: { value: 2.1, isPositive: false },
    icon: <PercentIcon />,
    color: 'warning'
  },
  {
    title: 'Active Subscriptions',
    value: analytics.data.subscriptions.activeSubscriptions,
    trend: { value: 8.7, isPositive: true },
    icon: <UsersIcon />,
    color: 'primary'
  }
];
```

### 2. Status Badge Component

```typescript
interface StatusBadgeProps {
  status: 'completed' | 'pending' | 'cancelled' | 'refunded';
}

const statusConfig = {
  completed: {
    label: 'Completed',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    icon: '✓'
  },
  pending: {
    label: 'Pending',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    icon: '⏳'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: '✕'
  },
  refunded: {
    label: 'Refunded',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    icon: '↩'
  }
};
```

### 3. Revenue Chart Component

```typescript
// Using Recharts
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const RevenueChart = ({ data }: { data: any }) => {
  const chartData = data.trends.revenue.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: item.revenue,
    orders: item.orders
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <XAxis 
          dataKey="date" 
          stroke="#94a3b8"
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke="#94a3b8"
          style={{ fontSize: '12px' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#f1f5f9'
          }}
        />
        <Line 
          type="monotone" 
          dataKey="revenue" 
          stroke="#8b5cf6" 
          strokeWidth={2}
          dot={{ fill: '#8b5cf6', r: 4 }}
        />
        <Line 
          type="monotone" 
          dataKey="orders" 
          stroke="#3b82f6" 
          strokeWidth={2}
          dot={{ fill: '#3b82f6', r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
```

### 4. Status Breakdown Donut Chart

```typescript
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

const StatusDonutChart = ({ data }: { data: any }) => {
  const chartData = data.breakdowns.status.map((item: any) => ({
    name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
    value: item.count
  }));

  const COLORS = {
    Completed: '#10b981',
    Pending: '#f59e0b',
    Cancelled: '#ef4444',
    Refunded: '#f97316'
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={5}
          dataKey="value"
        >
          {chartData.map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
          ))}
        </Pie>
        <Legend 
          verticalAlign="bottom" 
          height={36}
          iconType="circle"
          wrapperStyle={{ color: '#cbd5e1' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};
```

### 5. Purchases Table Component

```typescript
interface Purchase {
  _id: string;
  user: { name: string; email: string; profileImage?: string };
  purchaseType: 'individual' | 'subscription';
  amount: number;
  currency: string;
  status: string;
  purchaseDate: string;
  pricingPlan?: { name: string };
  design?: { title: string };
}

const PurchasesTable = ({ purchases }: { purchases: Purchase[] }) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full">
        <thead className="bg-slate-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Amount</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {purchases.map((purchase) => (
            <tr key={purchase._id} className="hover:bg-slate-800/50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <img 
                    className="h-8 w-8 rounded-full" 
                    src={purchase.user.profileImage || '/default-avatar.png'} 
                    alt="" 
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-slate-200">{purchase.user.name}</p>
                    <p className="text-sm text-slate-400">{purchase.user.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  purchase.purchaseType === 'subscription' 
                    ? 'bg-purple-500/20 text-purple-400' 
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {purchase.purchaseType === 'subscription' ? 'Subscription' : 'Individual'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-200">
                ${purchase.amount.toFixed(2)} {purchase.currency}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={purchase.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                {new Date(purchase.purchaseDate).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <button className="text-purple-400 hover:text-purple-300 mr-3">View</button>
                <button className="text-blue-400 hover:text-blue-300">Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### 6. Filter Component

```typescript
const PurchaseFilters = ({ onFilter }: { onFilter: (filters: any) => void }) => {
  const [filters, setFilters] = useState({
    status: '',
    purchaseType: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Status Filter */}
        <select 
          className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Type Filter */}
        <select 
          className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
          value={filters.purchaseType}
          onChange={(e) => setFilters({ ...filters, purchaseType: e.target.value })}
        >
          <option value="">All Types</option>
          <option value="subscription">Subscription</option>
          <option value="individual">Individual</option>
        </select>

        {/* Date Range */}
        <input 
          type="date"
          className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
        />
        <input 
          type="date"
          className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
        />

        {/* Search */}
        <input 
          type="text"
          placeholder="Search users..."
          className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-500"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>
      
      <div className="mt-4 flex gap-2">
        <button 
          onClick={() => onFilter(filters)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Apply Filters
        </button>
        <button 
          onClick={() => {
            setFilters({ status: '', purchaseType: '', startDate: '', endDate: '', search: '' });
            onFilter({});
          }}
          className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
};
```

---

## 🎨 Tailwind CSS Classes for Dark Mode

```css
/* Card */
.card {
  @apply bg-slate-800 rounded-lg border border-slate-700 p-6 shadow-lg;
}

/* Card Hover */
.card-hover {
  @apply hover:bg-slate-700/50 hover:border-slate-600 transition-all duration-200;
}

/* Button Primary */
.btn-primary {
  @apply bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg 
         transition-colors duration-200 font-medium shadow-lg shadow-purple-500/20;
}

/* Badge */
.badge {
  @apply px-3 py-1 text-xs rounded-full border font-medium;
}

/* Text Gradient */
.text-gradient {
  @apply bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent;
}
```

---

## 📦 Recommended Libraries

- **Charts**: Recharts or Chart.js
- **Tables**: TanStack Table (React Table)
- **UI Components**: Shadcn UI or Headless UI
- **Icons**: Heroicons or Lucide React
- **Date Picker**: React DatePicker
- **Animations**: Framer Motion

---

## 🚀 Implementation Steps

1. **Create Layout** - Set up the dashboard grid
2. **Fetch Data** - Use the enhanced API endpoints
3. **Build Stat Cards** - Display key metrics at the top
4. **Add Charts** - Revenue trend and status breakdown
5. **Create Table** - With sorting, filtering, and pagination
6. **Add Filters** - Date range, status, type, search
7. **Style Dark Mode** - Use the provided color palette
8. **Add Animations** - Smooth transitions and loading states

---

**Pro Tip**: Use CSS Grid for the dashboard layout and Flexbox for components. This ensures responsive design and easy maintenance.
