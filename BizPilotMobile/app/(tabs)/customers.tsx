import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  StyleSheet,
  Modal,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Plus, 
  Search, 
  Filter, 
  Users, 
  Phone, 
  Mail, 
  MapPin,
  DollarSign,
  ShoppingBag,
  UserPlus
} from 'lucide-react-native';
import * as Contacts from 'expo-contacts';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { theme } from '../../src/styles/theme';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
  is_active: boolean;
}

// Mock customers data for demo
const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    address: '123 Main St, City, State',
    total_orders: 5,
    total_spent: 500.00,
    last_order_date: '2024-01-15',
    is_active: true,
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1987654321',
    total_orders: 3,
    total_spent: 350.00,
    last_order_date: '2024-01-10',
    is_active: true,
  },
];

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Filter customers based on search
  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleCallCustomer = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmailCustomer = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleImportContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
        });

        if (data.length > 0) {
          Alert.alert(
            'Import Contacts',
            `Found ${data.length} contacts. Import the first 5?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Import',
                onPress: () => {
                  const importedCustomers = data.slice(0, 5).map((contact, index) => ({
                    id: `imported_${Date.now()}_${index}`,
                    name: contact.name || 'Unknown',
                    email: contact.emails?.[0]?.email,
                    phone: contact.phoneNumbers?.[0]?.number,
                    total_orders: 0,
                    total_spent: 0,
                    is_active: true,
                  }));
                  
                  setCustomers(prev => [...prev, ...importedCustomers]);
                  Alert.alert('Success', `Imported ${importedCustomers.length} customers`);
                }
              }
            ]
          );
        } else {
          Alert.alert('No Contacts', 'No contacts found on your device');
        }
      } else {
        Alert.alert('Permission Denied', 'Cannot access contacts without permission');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to import contacts');
    }
  };

  const renderCustomerCard = (customer: Customer) => (
    <Card key={customer.id} style={styles.customerCard}>
      <View style={styles.customerHeader}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{customer.name}</Text>
          {customer.email && (
            <Text style={styles.customerDetail}>{customer.email}</Text>
          )}
          {customer.phone && (
            <Text style={styles.customerDetail}>{customer.phone}</Text>
          )}
        </View>
        <View style={styles.customerStatus}>
          <View style={[
            styles.statusDot,
            { backgroundColor: customer.is_active ? theme.colors.green[500] : theme.colors.gray[500] }
          ]} />
        </View>
      </View>

      <View style={styles.customerStats}>
        <View style={styles.statItem}>
          <ShoppingBag size={16} color={theme.colors.primary[500]} />
          <Text style={styles.statValue}>{customer.total_orders}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statItem}>
          <DollarSign size={16} color={theme.colors.green[500]} />
          <Text style={styles.statValue}>${customer.total_spent.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Spent</Text>
        </View>
        {customer.last_order_date && (
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {new Date(customer.last_order_date).toLocaleDateString()}
            </Text>
            <Text style={styles.statLabel}>Last Order</Text>
          </View>
        )}
      </View>

      <View style={styles.customerActions}>
        {customer.phone && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleCallCustomer(customer.phone!)}
          >
            <Phone size={16} color={theme.colors.primary[500]} />
          </TouchableOpacity>
        )}
        {customer.email && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEmailCustomer(customer.email!)}
          >
            <Mail size={16} color={theme.colors.primary[500]} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionButton}>
          <ShoppingBag size={16} color={theme.colors.primary[500]} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Customers</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.importButton}
            onPress={handleImportContacts}
          >
            <UserPlus size={20} color={theme.colors.primary[500]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Plus size={24} color={theme.colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={theme.colors.gray[400]} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers..."
            placeholderTextColor={theme.colors.gray[400]}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      </View>

      {/* Stats Overview */}
      <Card style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Users size={20} color={theme.colors.primary[500]} />
            <Text style={styles.statValue}>{customers.length}</Text>
            <Text style={styles.statLabel}>Total Customers</Text>
          </View>
          <View style={styles.statItem}>
            <Users size={20} color={theme.colors.green[500]} />
            <Text style={styles.statValue}>
              {customers.filter(c => c.is_active).length}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <DollarSign size={20} color={theme.colors.yellow[500]} />
            <Text style={styles.statValue}>
              ${customers.reduce((sum, c) => sum + c.total_spent, 0).toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>Total Revenue</Text>
          </View>
        </View>
      </Card>

      {/* Customers List */}
      <ScrollView
        style={styles.customersList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredCustomers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Users size={48} color={theme.colors.gray[400]} />
            <Text style={styles.emptyText}>No customers found</Text>
            <Text style={styles.emptySubtext}>
              {searchTerm 
                ? 'Try adjusting your search'
                : 'Add your first customer to get started'
              }
            </Text>
            <Button
              title="Import from Contacts"
              variant="secondary"
              onPress={handleImportContacts}
              style={styles.emptyAction}
            />
          </View>
        ) : (
          filteredCustomers.map(renderCustomerCard)
        )}
      </ScrollView>

      {/* Create Customer Modal */}
      <CreateCustomerModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={(customerData) => {
          const newCustomer: Customer = {
            id: `customer_${Date.now()}`,
            ...customerData,
            total_orders: 0,
            total_spent: 0,
            is_active: true,
          };
          setCustomers(prev => [...prev, newCustomer]);
          setShowCreateModal(false);
        }}
      />
    </SafeAreaView>
  );
}

// Create Customer Modal Component
const CreateCustomerModal = ({ visible, onClose, onCreate }: {
  visible: boolean;
  onClose: () => void;
  onCreate: (data: any) => void;
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const handleCreate = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Customer name is required');
      return;
    }

    onCreate({
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
    });

    // Reset form
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>New Customer</Text>
          <TouchableOpacity onPress={handleCreate}>
            <Text style={styles.modalSaveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Input
            label="Name *"
            value={name}
            onChangeText={setName}
            placeholder="Enter customer name"
          />
          
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email address"
            keyboardType="email-address"
            style={styles.modalInput}
          />
          
          <Input
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
            style={styles.modalInput}
          />
          
          <Input
            label="Address"
            value={address}
            onChangeText={setAddress}
            placeholder="Enter address"
            multiline
            numberOfLines={3}
            style={styles.modalInput}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark[950],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  importButton: {
    backgroundColor: theme.colors.dark[800],
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.sm,
  },
  addButton: {
    backgroundColor: theme.colors.primary[600],
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.sm,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.dark[800],
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    paddingVertical: theme.spacing.sm,
  },
  statsCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[400],
  },
  customersList: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  customerCard: {
    marginBottom: theme.spacing.md,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
    marginBottom: 2,
  },
  customerDetail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
    marginBottom: 2,
  },
  customerStatus: {
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  customerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.dark[700],
  },
  customerActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.dark[700],
  },
  actionButton: {
    padding: theme.spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['4xl'],
  },
  emptyText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.gray[300],
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyAction: {
    marginTop: theme.spacing.lg,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.dark[950],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.dark[700],
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  modalCancelButton: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray[400],
  },
  modalSaveButton: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary[500],
    fontWeight: theme.fontWeight.medium,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
  },
  modalInput: {
    marginTop: theme.spacing.md,
  },
}); 