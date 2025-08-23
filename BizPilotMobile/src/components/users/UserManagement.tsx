import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  FlatList,
  Modal,
  RefreshControl,
} from 'react-native';
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Phone,
  Calendar,
  Settings,
  Edit3,
  Trash2,
  Crown,
  CheckCircle,
  X,
  Plus,
} from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { mcp_supabase_execute_sql } from '../../services/mcpClient';
import { useAuthStore } from '../../store/auth';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

interface BusinessUser {
  id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  invited_at: string;
  accepted_at?: string;
  user_profiles?: {
    email: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface UserRole {
  id: string;
  name: string;
  description: string;
  is_default: boolean;
  permissions: Array<{
    id: string;
    resource: string;
    action: string;
  }>;
}

interface UserFormData {
  email: string;
  fullName: string;
  password: string;
  role: string;
  customPermissions: string[];
  isActive: boolean;
}

interface RoleFormData {
  name: string;
  description: string;
  permissions: string[];
}

// Available permissions matching web app
const AVAILABLE_PERMISSIONS = {
  products: ['create', 'read', 'update', 'delete'],
  inventory: ['create', 'read', 'update', 'delete'],
  categories: ['create', 'read', 'update', 'delete'],
  suppliers: ['create', 'read', 'update', 'delete'],
  customers: ['create', 'read', 'update', 'delete'],
  orders: ['create', 'read', 'update', 'delete'],
  financial: ['create', 'read', 'update', 'delete'],
  ai: ['create', 'read', 'update', 'delete'],
  qr: ['create', 'read', 'update', 'delete'],
  settings: ['read', 'update'],
  users: ['create', 'read', 'update', 'delete'],
};

type TabType = 'users' | 'roles';

export default function UserManagement() {
  const { user, business } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [businessUsers, setBusinessUsers] = useState<BusinessUser[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingUser, setEditingUser] = useState<BusinessUser | null>(null);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  
  // Form states
  const [userFormData, setUserFormData] = useState<UserFormData>({
    email: '',
    fullName: '',
    password: '',
    role: '',
    customPermissions: [],
    isActive: true,
  });
  
  const [roleFormData, setRoleFormData] = useState<RoleFormData>({
    name: '',
    description: '',
    permissions: [],
  });
  
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [business]);

  const loadData = async () => {
    if (!business?.id) return;

    try {
      setLoading(true);
      await Promise.all([
        loadBusinessUsers(),
        loadUserRoles(),
      ]);
    } catch (error) {
      console.error('Error loading user management data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBusinessUsers = async () => {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT 
            bu.*,
            up.email,
            up.full_name,
            up.avatar_url
          FROM business_users bu
          LEFT JOIN user_profiles up ON bu.user_id = up.user_id
          WHERE bu.business_id = $1
          ORDER BY bu.role DESC, up.full_name ASC
        `,
        params: [business?.id]
      });

      if (result.success) {
        const users = (result.data || []).map((row: any) => ({
          id: row.id,
          user_id: row.user_id,
          role: row.role,
          is_active: row.is_active,
          invited_at: row.invited_at,
          accepted_at: row.accepted_at,
          user_profiles: {
            email: row.email,
            full_name: row.full_name,
            avatar_url: row.avatar_url,
          }
        }));
        setBusinessUsers(users);
      }
    } catch (error) {
      console.error('Error loading business users:', error);
    }
  };

  const loadUserRoles = async () => {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT 
            ur.*,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', up.id,
                  'resource', up.resource,
                  'action', up.action
                )
              ) FILTER (WHERE up.id IS NOT NULL),
              '[]'::json
            ) as permissions
          FROM user_roles ur
          LEFT JOIN user_permissions up ON ur.id = up.role_id
          WHERE ur.business_id = $1
          GROUP BY ur.id
          ORDER BY ur.is_default DESC, ur.name ASC
        `,
        params: [business?.id]
      });

      if (result.success) {
        setUserRoles(result.data || []);
      }
    } catch (error) {
      console.error('Error loading user roles:', error);
      // Fallback to default roles
      setUserRoles([
        {
          id: 'admin',
          name: 'Admin',
          description: 'Full access to all features',
          is_default: true,
          permissions: Object.entries(AVAILABLE_PERMISSIONS).flatMap(([resource, actions]) =>
            actions.map((action, index) => ({
              id: `${resource}_${action}_${index}`,
              resource,
              action,
            }))
          ),
        },
        {
          id: 'manager',
          name: 'Manager',
          description: 'Manage products and inventory',
          is_default: false,
          permissions: [
            { id: 'products_read', resource: 'products', action: 'read' },
            { id: 'products_update', resource: 'products', action: 'update' },
            { id: 'inventory_read', resource: 'inventory', action: 'read' },
            { id: 'inventory_update', resource: 'inventory', action: 'update' },
          ],
        },
        {
          id: 'employee',
          name: 'Employee',
          description: 'Basic access to view products and inventory',
          is_default: false,
          permissions: [
            { id: 'products_read_emp', resource: 'products', action: 'read' },
            { id: 'inventory_read_emp', resource: 'inventory', action: 'read' },
          ],
        },
      ]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (Platform.OS !== 'web' && (Haptics as any)?.impactAsync) {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    }
    await loadData();
    setRefreshing(false);
  };

  const inviteUser = async () => {
    if (!userFormData.email || !userFormData.fullName || !userFormData.role) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setSubmitLoading(true);

      // In a real implementation, this would send an invitation email
      const result = await mcp_supabase_execute_sql({
        query: `
          INSERT INTO business_users (
            business_id, user_id, role, is_active, invited_at
          ) VALUES ($1, $2, $3, $4, $5)
        `,
        params: [
          business?.id,
          `user_${Date.now()}`, // Mock user ID
          userFormData.role,
          userFormData.isActive,
          new Date().toISOString()
        ]
      });

      if (result.success) {
        if (Platform.OS !== 'web' && (Haptics as any)?.notificationAsync) {
          try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
        }
        Alert.alert('Success', 'User invitation sent successfully');
        
        setShowUserModal(false);
        resetUserForm();
        loadBusinessUsers();
      } else {
        Alert.alert('Error', 'Failed to invite user');
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      Alert.alert('Error', 'Failed to invite user');
    } finally {
      setSubmitLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      await mcp_supabase_execute_sql({
        query: `
          UPDATE business_users 
          SET role = $1, updated_at = $2
          WHERE user_id = $3 AND business_id = $4
        `,
        params: [newRole, new Date().toISOString(), userId, business?.id]
      });

      if (Platform.OS !== 'web' && (Haptics as any)?.notificationAsync) {
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      }
      Alert.alert('Success', 'User role updated successfully');
      loadBusinessUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      Alert.alert('Error', 'Failed to update user role');
    }
  };

  const removeUser = async (userId: string, userName: string) => {
    Alert.alert(
      'Remove User',
      `Are you sure you want to remove ${userName} from the business?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await mcp_supabase_execute_sql({
                query: 'DELETE FROM business_users WHERE user_id = $1 AND business_id = $2',
                params: [userId, business?.id]
              });

              if (Platform.OS !== 'web' && (Haptics as any)?.notificationAsync) {
                try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
              }
              Alert.alert('Success', 'User removed successfully');
              loadBusinessUsers();
            } catch (error) {
              console.error('Error removing user:', error);
              Alert.alert('Error', 'Failed to remove user');
            }
          }
        }
      ]
    );
  };

  const createRole = async () => {
    if (!roleFormData.name || !roleFormData.description) {
      Alert.alert('Error', 'Please fill in role name and description');
      return;
    }

    try {
      setSubmitLoading(true);

      // Create role
      const roleResult = await mcp_supabase_execute_sql({
        query: `
          INSERT INTO user_roles (business_id, name, description, is_default)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `,
        params: [business?.id, roleFormData.name, roleFormData.description, false]
      });

      if (roleResult.success && roleResult.data?.[0]?.id) {
        const roleId = roleResult.data[0].id;

        // Add permissions
        for (const permission of roleFormData.permissions) {
          const [resource, action] = permission.split(':');
          await mcp_supabase_execute_sql({
            query: `
              INSERT INTO user_permissions (role_id, resource, action)
              VALUES ($1, $2, $3)
            `,
            params: [roleId, resource, action]
          });
        }
      }

      if (Platform.OS !== 'web' && (Haptics as any)?.notificationAsync) {
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      }
      Alert.alert('Success', 'Role created successfully');
      
      setShowRoleModal(false);
      resetRoleForm();
      loadUserRoles();
    } catch (error) {
      console.error('Error creating role:', error);
      Alert.alert('Error', 'Failed to create role');
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetUserForm = () => {
    setUserFormData({
      email: '',
      fullName: '',
      password: '',
      role: '',
      customPermissions: [],
      isActive: true,
    });
    setEditingUser(null);
  };

  const resetRoleForm = () => {
    setRoleFormData({
      name: '',
      description: '',
      permissions: [],
    });
    setEditingRole(null);
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'admin':
        return <Crown size={16} color="#f59e0b" />;
      case 'manager':
        return <Shield size={16} color="#3b82f6" />;
      default:
        return <Users size={16} color="#6b7280" />;
    }
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'admin':
        return '#f59e0b';
      case 'manager':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const filteredUsers = businessUsers.filter(user =>
    user.user_profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderUserItem = ({ item }: { item: BusinessUser }) => (
    <TouchableOpacity style={styles.userItem}>
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.userName}>{item.user_profiles?.full_name || 'Unknown User'}</Text>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) + '20' }]}>
            {getRoleIcon(item.role)}
            <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
              {item.role}
            </Text>
          </View>
        </View>
        
        <Text style={styles.userEmail}>{item.user_profiles?.email}</Text>
        
        <View style={styles.userMeta}>
          <Text style={styles.userMetaText}>
            Invited: {new Date(item.invited_at).toLocaleDateString()}
          </Text>
          {item.accepted_at && (
            <Text style={styles.userMetaText}>
              Joined: {new Date(item.accepted_at).toLocaleDateString()}
            </Text>
          )}
        </View>

        <View style={styles.userStatus}>
          <View style={[
            styles.statusIndicator,
            item.is_active ? styles.activeStatus : styles.inactiveStatus
          ]}>
            <Text style={[
              styles.statusText,
              item.is_active ? styles.activeStatusText : styles.inactiveStatusText
            ]}>
              {item.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.userActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            // Show role change options
            const roleOptions = userRoles.map(role => ({
              text: role.name,
              onPress: () => updateUserRole(item.user_id, role.name)
            }));
            
            Alert.alert(
              'Change Role',
              'Select a new role for this user:',
              [
                ...roleOptions,
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }}
        >
          <Edit3 size={16} color="#a78bfa" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => removeUser(item.user_id, item.user_profiles?.full_name || 'User')}
        >
          <Trash2 size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderRoleItem = ({ item }: { item: UserRole }) => (
    <TouchableOpacity style={styles.roleItem}>
      <View style={styles.roleInfo}>
        <View style={styles.roleHeader}>
          <Text style={styles.roleName}>{item.name}</Text>
          {item.is_default && (
            <View style={styles.defaultBadge}>
              <CheckCircle size={12} color="#22c55e" />
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.roleDescription}>{item.description}</Text>
        
        <View style={styles.permissionsCount}>
          <Text style={styles.permissionsText}>
            {item.permissions.length} permissions
          </Text>
        </View>
      </View>

      <View style={styles.roleActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setEditingRole(item);
            setRoleFormData({
              name: item.name,
              description: item.description,
              permissions: item.permissions.map(p => `${p.resource}:${p.action}`),
            });
            setShowRoleModal(true);
          }}
        >
          <Edit3 size={16} color="#a78bfa" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderUserModal = () => (
    <Modal
      visible={showUserModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowUserModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowUserModal(false)}>
            <X size={24} color="#a78bfa" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editingUser ? 'Edit User' : 'Invite User'}
          </Text>
          <TouchableOpacity onPress={inviteUser} disabled={submitLoading}>
            <Text style={[styles.saveButton, submitLoading && styles.disabledButton]}>
              {editingUser ? 'Save' : 'Invite'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Input
            value={userFormData.email}
            onChangeText={(value) => setUserFormData(prev => ({ ...prev, email: value }))}
            placeholder="Email address"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.modalInput}
          />

          <Input
            value={userFormData.fullName}
            onChangeText={(value) => setUserFormData(prev => ({ ...prev, fullName: value }))}
            placeholder="Full name"
            style={styles.modalInput}
          />

          {!editingUser && (
            <Input
              value={userFormData.password}
              onChangeText={(value) => setUserFormData(prev => ({ ...prev, password: value }))}
              placeholder="Temporary password"
              secureTextEntry
              style={styles.modalInput}
            />
          )}

          <Text style={styles.fieldLabel}>Role</Text>
          <View style={styles.roleSelector}>
            {userRoles.map(role => (
              <TouchableOpacity
                key={role.id}
                style={[
                  styles.roleSelectorItem,
                  userFormData.role === role.name && styles.selectedRoleItem
                ]}
                onPress={() => setUserFormData(prev => ({ ...prev, role: role.name }))}
              >
                {getRoleIcon(role.name)}
                <Text style={[
                  styles.roleSelectorText,
                  userFormData.role === role.name && styles.selectedRoleText
                ]}>
                  {role.name}
                </Text>
                {userFormData.role === role.name && (
                  <CheckCircle size={16} color="#22c55e" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetUserForm();
            setShowUserModal(true);
          }}
        >
          <UserPlus size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => {
            setActiveTab('users');
            if (Platform.OS !== 'web' && (Haptics as any)?.impactAsync) {
              try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
            }
          }}
        >
          <Users size={20} color={activeTab === 'users' ? '#a78bfa' : '#9ca3af'} />
          <Text style={[
            styles.tabText,
            activeTab === 'users' && styles.activeTabText
          ]}>
            Users ({businessUsers.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'roles' && styles.activeTab]}
          onPress={() => {
            setActiveTab('roles');
            if (Platform.OS !== 'web' && (Haptics as any)?.impactAsync) {
              try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
            }
          }}
        >
          <Shield size={20} color={activeTab === 'roles' ? '#a78bfa' : '#9ca3af'} />
          <Text style={[
            styles.tabText,
            activeTab === 'roles' && styles.activeTabText
          ]}>
            Roles ({userRoles.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Input
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder={`Search ${activeTab}...`}
          style={styles.searchInput}
        />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {activeTab === 'users' ? (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Users size={48} color="#6b7280" />
                <Text style={styles.emptyStateText}>No users found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Invite team members to get started
                </Text>
              </View>
            )}
          />
        ) : (
          <FlatList
            data={userRoles}
            keyExtractor={(item) => item.id}
            renderItem={renderRoleItem}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Shield size={48} color="#6b7280" />
                <Text style={styles.emptyStateText}>No roles found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Create custom roles for your team
                </Text>
              </View>
            )}
          />
        )}
      </ScrollView>

      {/* Modals */}
      {renderUserModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addButton: {
    backgroundColor: '#a78bfa',
    borderRadius: 8,
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#1e293b',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#a78bfa',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchInput: {
    marginBottom: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userItem: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  userEmail: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  userMetaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  userStatus: {
    flexDirection: 'row',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeStatus: {
    backgroundColor: '#22c55e20',
  },
  inactiveStatus: {
    backgroundColor: '#ef444420',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeStatusText: {
    color: '#22c55e',
  },
  inactiveStatusText: {
    color: '#ef4444',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  roleItem: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  roleInfo: {
    flex: 1,
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#22c55e20',
    borderRadius: 12,
  },
  defaultText: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '500',
  },
  roleDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  permissionsCount: {
    flexDirection: 'row',
  },
  permissionsText: {
    fontSize: 12,
    color: '#6b7280',
  },
  roleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  separator: {
    height: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#020617',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a78bfa',
  },
  disabledButton: {
    color: '#6b7280',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalInput: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d1d5db',
    marginBottom: 12,
  },
  roleSelector: {
    gap: 8,
  },
  roleSelectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  selectedRoleItem: {
    borderColor: '#a78bfa',
    backgroundColor: '#a78bfa20',
  },
  roleSelectorText: {
    fontSize: 16,
    color: '#ffffff',
    flex: 1,
  },
  selectedRoleText: {
    color: '#a78bfa',
    fontWeight: '600',
  },
}); 