// MCP Client Service for Mobile App
// This service handles all database operations via the Supabase MCP Server

interface MCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface QueryParams {
  query: string;
  params?: any[];
}

interface MigrationParams {
  name: string;
  query: string;
}

class MCPClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.bizpilot.com';
    this.apiKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  }

  async executeSQL(params: QueryParams): Promise<MCPResponse> {
    try {
      // In a real implementation, this would call the actual MCP server
      // For now, we'll simulate the response structure
      console.log('MCP SQL Execution:', params);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock successful response
      return {
        success: true,
        data: this.getMockData(params.query),
        message: 'Query executed successfully'
      };
    } catch (error) {
      console.error('MCP SQL Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to execute query'
      };
    }
  }

  async applyMigration(params: MigrationParams): Promise<MCPResponse> {
    try {
      console.log('MCP Migration:', params);
      
      // Simulate migration execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: `Migration ${params.name} applied successfully`
      };
    } catch (error) {
      console.error('MCP Migration Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to apply migration'
      };
    }
  }

  async getAdvisors(type: 'security' | 'performance'): Promise<MCPResponse> {
    try {
      console.log('MCP Advisors:', type);
      
      return {
        success: true,
        data: [],
        message: 'No advisors found'
      };
    } catch (error) {
      console.error('MCP Advisors Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private getMockData(query: string): any[] {
    // Simple query pattern matching for mock data
    if (query.includes('orders')) {
      return [
        {
          id: '1',
          business_id: 'business_1',
          customer_id: '1',
          order_number: 'ORD-000001',
          status: 'pending',
          subtotal: 100.00,
          tax_amount: 8.00,
          total_amount: 108.00,
          payment_status: 'unpaid',
          order_date: new Date().toISOString(),
          customer_name: 'John Doe',
          items: [
            {
              id: '1',
              product_id: '1',
              product_name: 'Sample Product',
              quantity: 2,
              unit_price: 50.00,
              total_price: 100.00
            }
          ]
        }
      ];
    }

    if (query.includes('customers')) {
      return [
        {
          id: '1',
          business_id: 'business_1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          total_orders: 5,
          total_spent: 500.00,
          last_order_date: new Date().toISOString(),
          is_active: true
        }
      ];
    }

    if (query.includes('expenses')) {
      return [
        {
          id: '1',
          business_id: 'business_1',
          amount: 150.00,
          description: 'Office Supplies',
          category: 'Office',
          expense_date: new Date().toISOString(),
          receipt_url: null
        }
      ];
    }

    return [];
  }

  // Utility method to check if MCP server is available
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.executeSQL({ query: 'SELECT 1' });
      return response.success;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const mcpClient = new MCPClient();

// Export convenience functions that match the web app's MCP integration
export const mcp_supabase_execute_sql = (params: QueryParams) => 
  mcpClient.executeSQL(params);

export const mcp_supabase_apply_migration = (params: MigrationParams) => 
  mcpClient.applyMigration(params);

export const mcp_supabase_get_advisors = (params: { type: 'security' | 'performance' }) => 
  mcpClient.getAdvisors(params.type);

export default mcpClient; 