import { ComponentType } from './types';

// Mock responses to simulate API calls without CORS issues in the demo
export const MOCK_API_RESPONSES: Record<string, any> = {
  'sales-data': [
    { month: 'Jan', sales: 4000, profit: 2400 },
    { month: 'Feb', sales: 3000, profit: 1398 },
    { month: 'Mar', sales: 2000, profit: 9800 },
    { month: 'Apr', sales: 2780, profit: 3908 },
    { month: 'May', sales: 1890, profit: 4800 },
    { month: 'Jun', sales: 2390, profit: 3800 },
  ],
  'user-stats': {
    activeUsers: 12543,
    growth: "+12.5%",
    status: "Healthy"
  },
  'product-info': {
    title: "Premium Headphones",
    description: "High fidelity wireless headphones with noise cancellation.",
    features: ["Bluetooth 5.0", "40h Battery", "Active NC"],
    image: "https://picsum.photos/400/300",
    price: 299.99
  },
  'report-pdf': {
    url: "https://pdfobject.com/pdf/sample.pdf"
  }
};

export const INITIAL_COMPONENTS = [];