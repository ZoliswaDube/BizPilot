// MCP Client Service for Mobile App
// This service handles all database operations via Supabase

import { supabase } from '../lib/supabase';

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
  async executeSQL(params: QueryParams): Promise<MCPResponse> {
    try {
      console.log('🔄 Executing SQL via Supabase client:', params.query.substring(0, 100) + '...');
      
      // Parse the SQL query to determine the operation and route to appropriate Supabase method
      const query = params.query.trim().toLowerCase();
      const queryParams = params.params || [];

      if (query.startsWith('select')) {
        return await this.handleSelect(params.query, queryParams);
      } else if (query.startsWith('insert')) {
        return await this.handleInsert(params.query, queryParams);
      } else if (query.startsWith('update')) {
        return await this.handleUpdate(params.query, queryParams);
      } else if (query.startsWith('delete')) {
        return await this.handleDelete(params.query, queryParams);
      } else {
        throw new Error('Unsupported SQL operation');
      }
    } catch (error) {
      console.error('❌ MCP SQL Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to execute query'
      };
    }
  }

  private async handleSelect(query: string, params: any[]): Promise<MCPResponse> {
    try {
      // For complex queries, we'll use a simplified approach
      // In a real implementation, you'd want a proper SQL parser
      
      if (query.includes('orders') && query.includes('customers') && query.includes('order_items')) {
        // Complex orders query with joins
        const businessId = params[0];
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            customers(name),
            order_items(id, product_id, product_name, quantity, unit_price, total_price)
          `)
          .eq('business_id', businessId)
          .order('order_date', { ascending: false });

        if (error) throw error;

        // Transform data to match expected format
        const transformedData = data?.map(order => ({
          ...order,
          customer_name: order.customers?.name,
          items: order.order_items || []
        })) || [];

        return { success: true, data: transformedData };
      } else if (query.includes('customers') && query.includes('business_id')) {
        // Customer query
        const businessId = params[0];
        const { data, error } = await supabase
          .from('customers')
          .select('id, name, email, phone')
          .eq('business_id', businessId)
          .order('name');

        if (error) throw error;
        return { success: true, data };
      } else if (query.includes('products') && query.includes('business_id')) {
        // Product query
        const businessId = params[0];
        const { data, error } = await supabase
          .from('products')
          .select('id, name, price, sku')
          .eq('business_id', businessId)
          .order('name');

        if (error) throw error;
        return { success: true, data };
      } else if (query.includes('order_number') && query.includes('max')) {
        // Order number generation
        const businessId = params[0];
        const { data, error } = await supabase
          .from('orders')
          .select('order_number')
          .eq('business_id', businessId)
          .like('order_number', 'ORD-%')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;
        
        let nextNumber = 1;
        if (data?.[0]?.order_number) {
          const match = data[0].order_number.match(/ORD-(\d+)/);
          if (match) {
            nextNumber = parseInt(match[1]) + 1;
          }
        }
        
        return { success: true, data: [{ next_number: nextNumber }] };
      } else if (query.includes('products') && query.includes('name') && params.length === 1) {
        // Single product name lookup
        const productId = params[0];
        const { data, error } = await supabase
          .from('products')
          .select('name')
          .eq('id', productId)
          .single();

        if (error) throw error;
        return { success: true, data: [data] };
      }

      throw new Error('Unsupported SELECT query pattern');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async handleInsert(query: string, params: any[]): Promise<MCPResponse> {
    try {
      if (query.includes('orders')) {
        // Insert order
        const [businessId, customerId, orderNumber, subtotal, taxAmount, totalAmount, notes, createdBy] = params;
        const { data, error } = await supabase
          .from('orders')
          .insert({
            business_id: businessId,
            customer_id: customerId,
            order_number: orderNumber,
            subtotal,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            notes,
            created_by: createdBy
          })
          .select('id')
          .single();

        if (error) throw error;
        return { success: true, data: [data] };
      } else if (query.includes('order_items')) {
        // Insert order item
        const [orderId, productId, productName, quantity, unitPrice, totalPrice] = params;
        const { error } = await supabase
          .from('order_items')
          .insert({
            order_id: orderId,
            product_id: productId,
            product_name: productName,
            quantity,
            unit_price: unitPrice,
            total_price: totalPrice
          });

        if (error) throw error;
        return { success: true, data: [] };
      }

      throw new Error('Unsupported INSERT query pattern');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async handleUpdate(query: string, params: any[]): Promise<MCPResponse> {
    try {
      if (query.includes('orders') && query.includes('status')) {
        // Update order status
        const [status, orderId, businessId] = params;
        const { error } = await supabase
          .from('orders')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', orderId)
          .eq('business_id', businessId);

        if (error) throw error;
        return { success: true, data: [] };
      } else if (query.includes('inventory') && query.includes('current_quantity')) {
        // Update inventory - we'll use RPC for this complex operation
        const [quantity, productId, businessId] = params;
        const { error } = await supabase.rpc('update_inventory_quantity', {
          p_product_id: productId,
          p_business_id: businessId,
          p_quantity_change: -quantity
        });

        if (error) throw error;
        return { success: true, data: [] };
      }

      throw new Error('Unsupported UPDATE query pattern');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async handleDelete(query: string, params: any[]): Promise<MCPResponse> {
    try {
      // Add delete handlers as needed
      throw new Error('DELETE operations not implemented yet');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async applyMigration(params: MigrationParams): Promise<MCPResponse> {
    try {
      console.log('🔄 Migration requests not supported in mobile client');
      return {
        success: false,
        error: 'Migrations should be applied on the server side',
        message: 'Migration not supported in mobile client'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to apply migration'
      };
    }
  }

  async getAdvisors(type: 'security' | 'performance'): Promise<MCPResponse> {
    try {
      console.log('🔄 Advisor requests not supported in mobile client');
      return {
        success: true,
        data: [],
        message: 'Advisors not available in mobile client'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Utility method to check if Supabase is available
  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await supabase.from('user_profiles').select('id').limit(1);
      return !error;
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