import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  SafeAreaView,
  Switch,
} from 'react-native';
import {
  Users,
  Plus,
  Edit3,
  Trash2,
  Search,
  Shield,
  User,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Settings,
  Key,
  X,
  Save,
} from 'lucide-react-native';
import { useAnalytics } from '../../hooks/useAnalytics';
import { mcp_supabase_execute_sql } from '../../services/mcpClient';
import { useAuthStore } from '../../store/auth';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { theme } from '../../styles/theme';
import * as Haptics from 'expo-haptics';

export interface BusinessUser {
  id: string;
  user_id: string;
  business_id: string;
  role: string;
  is_active: boolean;
  permissions: string[];
  created_at: string;
  updated_at: string;
  user_profiles: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    phone?: string;
    last_sign_in: string;
  };
}

export interface UserRole {
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
  reports: ['read', 'export'],
};

type TabType = 'users' | 'roles';

export function UserManagement() {
  useAnalytics('User Management');
  
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [businessUsers, setBusinessUsers] = useState<BusinessUser[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([fetchBusinessUsers(), fetchUserRoles()]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load user management data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessUsers = async () => {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT 
            bu.*,
            up.email,
            up.full_name,
            up.avatar_url,
            up.phone,
            up.last_sign_in_at as last_sign_in,
            COALESCE(
              array_agg(DISTINCT ur.name) FILTER (WHERE ur.name IS NOT NULL), 
              ARRAY[]::text[]
            ) as role_names,
            COALESCE(
              array_agg(DISTINCT (urp.resource || ':' || urp.action)) FILTER (WHERE urp.resource IS NOT NULL), 
              ARRAY[]::text[]
            ) as permissions
          FROM business_users bu
          LEFT JOIN user_profiles up ON bu.user_id = up.id
          LEFT JOIN user_roles ur ON bu.role = ur.id
          LEFT JOIN user_role_permissions urp ON ur.id = urp.role_id
          WHERE bu.business_id = $1
          GROUP BY bu.id, up.email, up.full_name, up.avatar_url, up.phone, up.last_sign_in_at
          ORDER BY bu.created_at DESC
        `,
        params: [user?.business_id || 'demo-business']
      });

      if (result.success && result.data) {
        setBusinessUsers(result.data);
      } else {
        // Mock data for development
        const mockUsers: BusinessUser[] = [
          {
            id: '1',
            user_id: 'user-1',
            business_id: 'demo-business',
            role: 'admin',
            is_active: true,
            permissions: ['products:create', 'products:read', 'products:update', 'products:delete'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_profiles: {
              id: 'profile-1',
              email: 'admin@bizpilot.com',
              full_name: 'Admin User',
              avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
              phone: '+1 (555) 123-4567',
              last_sign_in: new Date().toISOString(),
            },
          },
          {
            id: '2',
            user_id: 'user-2',
            business_id: 'demo-business',
            role: 'manager',
            is_active: true,
            permissions: ['products:read', 'inventory:read', 'inventory:update'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_profiles: {
              id: 'profile-2',
              email: 'manager@bizpilot.com',
              full_name: 'Manager User',
              phone: '+1 (555) 987-6543',
              last_sign_in: new Date(Date.now() - 86400000).toISOString(),
            },
          },
        ];
        setBusinessUsers(mockUsers);
      }
    } catch (err) {
      console.error('Error fetching business users:', err);
    }
  };

  const fetchUserRoles = async () => {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT 
            ur.*,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', urp.id,
                  'resource', urp.resource,
                  'action', urp.action
                )
              ) FILTER (WHERE urp.id IS NOT NULL),
              '[]'::json
            ) as permissions
          FROM user_roles ur
          LEFT JOIN user_role_permissions urp ON ur.id = urp.role_id
          WHERE ur.business_id = $1
          GROUP BY ur.id
          ORDER BY ur.is_default DESC, ur.name ASC
        `,
        params: [user?.business_id || 'demo-business']
      });

      if (result.success && result.data) {
        setUserRoles(result.data);
      } else {
        // Mock data for development
        const mockRoles: UserRole[] = [
          {
            id: '1',
            name: 'Admin',
            description: 'Full access to all features',
            is_default: true,
            permissions: [
              { id: '1', resource: 'products', action: 'create' },
              { id: '2', resource: 'products', action: 'read' },
              { id: '3', resource: 'products', action: 'update' },
              { id: '4', resource: 'products', action: 'delete' },
            ],
          },
          {
            id: '2',
            name: 'Manager',
            description: 'Manage products and inventory',
            is_default: false,
            permissions: [
              { id: '5', resource: 'products', action: 'read' },
              { id: '6', resource: 'products', action: 'update' },
              { id: '7', resource: 'inventory', action: 'read' },
              { id: '8', resource: 'inventory', action: 'update' },
            ],
          },
        ];
        setUserRoles(mockRoles);
      }
    } catch (err) {
      console.error('Error fetching user roles:', err);
    }
  };

  const handleCreateUser = async () => {
    try {
      setSubmitLoading(true);
      setError(null);

      if (!userFormData.email.trim() || !userFormData.fullName.trim() || !userFormData.password.trim()) {
        setError('Email, full name, and password are required');
        return;
      }

      // Create user via MCP server
      const result = await mcp_supabase_execute_sql({
        query: `
          INSERT INTO business_users (business_id, user_id, role, is_active, created_by)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `,
        params: [
          user?.business_id || 'demo-business',
          `user-${Date.now()}`, // In real implementation, this would be the created user ID
          userFormData.role,
          userFormData.isActive,
          user?.id || 'demo-user'
        ]
      });

      if (result.success) {
        await fetchBusinessUsers();
        resetUserForm();
        setShowUserModal(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else {
        setError('Failed to create user');
      }
    } catch (err) {
      setError('Failed to create user');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      setSubmitLoading(true);
      setError(null);

      const result = await mcp_supabase_execute_sql({
        query: `
          UPDATE business_users 
          SET role = $1, is_active = $2, updated_at = now()
          WHERE id = $3 AND business_id = $4
        `,
        params: [
          userFormData.role,
          userFormData.isActive,
          editingUser.id,
          user?.business_id || 'demo-business'
        ]
      });

      if (result.success) {
        await fetchBusinessUsers();
        resetUserForm();
        setShowUserModal(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else {
        setError('Failed to update user');
      }
    } catch (err) {
      setError('Failed to update user');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteUser = async (businessUser: BusinessUser) => {
    if (businessUser.user_id === user?.id) {
      Alert.alert('Cannot Delete', 'You cannot delete your own account.');
      return;
    }

    Alert.alert(
      'Delete User',
      `Are you sure you want to remove "${businessUser.user_profiles.full_name}" from this business?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await mcp_supabase_execute_sql({
                query: `DELETE FROM business_users WHERE id = $1 AND business_id = $2`,
                params: [businessUser.id, user?.business_id || 'demo-business']
              });

              if (result.success) {
                await fetchBusinessUsers();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to remove user');
            }
          },
        },
      ]
    );
  };

  const handleCreateRole = async () => {
    try {
      setSubmitLoading(true);
      setError(null);

      if (!roleFormData.name.trim() || !roleFormData.description.trim()) {
        setError('Role name and description are required');
        return;
      }

      const result = await mcp_supabase_execute_sql({
        query: `
          INSERT INTO user_roles (business_id, name, description, is_default, created_by)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `,
        params: [
          user?.business_id || 'demo-business',
          roleFormData.name.trim(),
          roleFormData.description.trim(),
          false,
          user?.id || 'demo-user'
        ]
      });

      if (result.success) {
        await fetchUserRoles();
        resetRoleForm();
        setShowRoleModal(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else {
        setError('Failed to create role');
      }
    } catch (err) {
      setError('Failed to create role');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;

    try {
      setSubmitLoading(true);
      setError(null);

      const result = await mcp_supabase_execute_sql({
        query: `
          UPDATE user_roles 
          SET name = $1, description = $2, updated_at = now()
          WHERE id = $3 AND business_id = $4
        `,
        params: [
          roleFormData.name.trim(),
          roleFormData.description.trim(),
          editingRole.id,
          user?.business_id || 'demo-business'
        ]
      });

      if (result.success) {
        await fetchUserRoles();
        resetRoleForm();
        setShowRoleModal(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else {
        setError('Failed to update role');
      }
    } catch (err) {
      setError('Failed to update role');
    } finally {
      setSubmitLoading(false);
    }
  };

  const openUserModal = (businessUser?: BusinessUser) => {
    if (businessUser) {
      setEditingUser(businessUser);
      setUserFormData({
        email: businessUser.user_profiles.email,
        fullName: businessUser.user_profiles.full_name,
        password: '',
        role: businessUser.role,
        customPermissions: businessUser.permissions,
        isActive: businessUser.is_active,
      });
    } else {
      setEditingUser(null);
      resetUserForm();
    }
    setShowUserModal(true);
  };

  const openRoleModal = (role?: UserRole) => {
    if (role) {
      setEditingRole(role);
      setRoleFormData({
        name: role.name,
        description: role.description,
        permissions: role.permissions.map(p => `${p.resource}:${p.action}`),
      });
    } else {
      setEditingRole(null);
      resetRoleForm();
    }
    setShowRoleModal(true);
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
    setError(null);
  };

  const resetRoleForm = () => {
    setRoleFormData({
      name: '',
      description: '',
      permissions: [],
    });
    setEditingRole(null);
    setError(null);
  };

  const togglePermission = (resource: string, action: string) => {
    const permission = `${resource}:${action}`;
    const isSelected = roleFormData.permissions.includes(permission);
    
    setRoleFormData(prev => ({
      ...prev,
      permissions: isSelected
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const filteredUsers = businessUsers.filter(user =>
    user.user_profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_profiles.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRoles = userRoles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderUserItem = (businessUser: BusinessUser) => (
    <Card key={businessUser.id} style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{businessUser.user_profiles.full_name}</Text>
          <Text style={styles.userEmail}>{businessUser.user_profiles.email}</Text>
          <Text style={styles.userRole}>Role: {businessUser.role}</Text>
        </View>
        <View style={styles.userMeta}>
          <View style={[
            styles.statusBadge,
            businessUser.is_active ? styles.activeBadge : styles.inactiveBadge
          ]}>
            <Text style={[
              styles.statusText,
              businessUser.is_active ? styles.activeText : styles.inactiveText
            ]}>
              {businessUser.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.userActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openUserModal(businessUser)}
        >
          <Edit3 size={16} color={theme.colors.yellow[500]} />
          <Text style={[styles.actionButtonText, { color: theme.colors.yellow[500] }]}>
            Edit
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteUser(businessUser)}
        >
          <Trash2 size={16} color={theme.colors.red[500]} />
          <Text style={[styles.actionButtonText, { color: theme.colors.red[500] }]}>
            Remove
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderRoleItem = (role: UserRole) => (
    <Card key={role.id} style={styles.roleCard}>
      <View style={styles.roleHeader}>
        <View style={styles.roleInfo}>
          <View style={styles.roleNameRow}>
            <Text style={styles.roleName}>{role.name}</Text>
            {role.is_default && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Default</Text>
              </View>
            )}
          </View>
          <Text style={styles.roleDescription}>{role.description}</Text>
          <Text style={styles.rolePermissions}>
            {role.permissions.length} permissions
          </Text>
        </View>
      </View>

      <View style={styles.roleActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openRoleModal(role)}
        >
          <Edit3 size={16} color={theme.colors.yellow[500]} />
          <Text style={[styles.actionButtonText, { color: theme.colors.yellow[500] }]}>
            Edit
          </Text>
        </TouchableOpacity>
        {!role.is_default && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Alert.alert(
                'Delete Role',
                `Are you sure you want to delete the "${role.name}" role?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive' },
                ]
              );
            }}
          >
            <Trash2 size={16} color={theme.colors.red[500]} />
            <Text style={[styles.actionButtonText, { color: theme.colors.red[500] }]}>
              Delete
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  const renderPermissionMatrix = () => (
    <View style={styles.permissionMatrix}>
      <Text style={styles.permissionTitle}>Permissions</Text>
      {Object.entries(AVAILABLE_PERMISSIONS).map(([resource, actions]) => (
        <View key={resource} style={styles.permissionResource}>
          <Text style={styles.resourceName}>{resource.charAt(0).toUpperCase() + resource.slice(1)}</Text>
          <View style={styles.permissionActions}>
            {actions.map(action => {
              const permission = `${resource}:${action}`;
              const isSelected = roleFormData.permissions.includes(permission);
              
              return (
                <TouchableOpacity
                  key={action}
                  style={[
                    styles.permissionChip,
                    isSelected ? styles.permissionChipSelected : styles.permissionChipUnselected
                  ]}
                  onPress={() => {
                    togglePermission(resource, action);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={[
                    styles.permissionChipText,
                    isSelected ? styles.permissionChipTextSelected : styles.permissionChipTextUnselected
                  ]}>
                    {action}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <Text style={styles.subtitle}>Manage team members and roles</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => {
            setActiveTab('users');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Users size={16} color={activeTab === 'users' ? theme.colors.white : theme.colors.gray[400]} />
          <Text style={[
            styles.tabText,
            activeTab === 'users' ? styles.activeTabText : styles.inactiveTabText
          ]}>
            Users
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'roles' && styles.activeTab]}
          onPress={() => {
            setActiveTab('roles');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Shield size={16} color={activeTab === 'roles' ? theme.colors.white : theme.colors.gray[400]} />
          <Text style={[
            styles.tabText,
            activeTab === 'roles' ? styles.activeTabText : styles.inactiveTabText
          ]}>
            Roles
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search and Add Button */}
      <Card style={styles.controlsCard}>
        <Input
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder={`Search ${activeTab}...`}
          leftIcon={<Search size={16} color={theme.colors.gray[400]} />}
          style={styles.searchInput}
        />
        <Button
          variant="primary"
          onPress={() => {
            if (activeTab === 'users') {
              openUserModal();
            } else {
              openRoleModal();
            }
          }}
          style={styles.addButton}
        >
          <Plus size={16} color={theme.colors.white} />
          <Text style={styles.addButtonText}>
            Add {activeTab === 'users' ? 'User' : 'Role'}
          </Text>
        </Button>
      </Card>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading {activeTab}...</Text>
          </View>
        ) : error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Button variant="secondary" onPress={fetchData} style={styles.retryButton}>
              Retry
            </Button>
          </Card>
        ) : activeTab === 'users' ? (
          filteredUsers.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Users size={48} color={theme.colors.gray[500]} />
              <Text style={styles.emptyTitle}>No Users Found</Text>
              <Text style={styles.emptyDescription}>
                {searchTerm ? 'Try adjusting your search' : 'Add team members to collaborate'}
              </Text>
            </Card>
          ) : (
            filteredUsers.map(renderUserItem)
          )
        ) : (
          filteredRoles.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Shield size={48} color={theme.colors.gray[500]} />
              <Text style={styles.emptyTitle}>No Roles Found</Text>
              <Text style={styles.emptyDescription}>
                {searchTerm ? 'Try adjusting your search' : 'Create roles to organize permissions'}
              </Text>
            </Card>
          ) : (
            filteredRoles.map(renderRoleItem)
          )
        )}
      </ScrollView>

      {/* User Modal */}
      <Modal
        visible={showUserModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUserModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowUserModal(false)}>
              <X size={24} color={theme.colors.gray[400]} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingUser ? 'Edit User' : 'Add User'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Email *</Text>
              <Input
                value={userFormData.email}
                onChangeText={(value) => setUserFormData(prev => ({ ...prev, email: value }))}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!editingUser}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Full Name *</Text>
              <Input
                value={userFormData.fullName}
                onChangeText={(value) => setUserFormData(prev => ({ ...prev, fullName: value }))}
                placeholder="Enter full name"
              />
            </View>

            {!editingUser && (
              <View style={styles.formSection}>
                <Text style={styles.fieldLabel}>Password *</Text>
                <Input
                  value={userFormData.password}
                  onChangeText={(value) => setUserFormData(prev => ({ ...prev, password: value }))}
                  placeholder="Enter password"
                  secureTextEntry
                />
              </View>
            )}

            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Role</Text>
              <View style={styles.roleSelector}>
                {userRoles.map(role => (
                  <TouchableOpacity
                    key={role.id}
                    style={[
                      styles.roleOption,
                      userFormData.role === role.id && styles.roleOptionSelected
                    ]}
                    onPress={() => {
                      setUserFormData(prev => ({ ...prev, role: role.id }));
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={[
                      styles.roleOptionText,
                      userFormData.role === role.id && styles.roleOptionTextSelected
                    ]}>
                      {role.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formSection}>
              <View style={styles.switchRow}>
                <Text style={styles.fieldLabel}>Active User</Text>
                <Switch
                  value={userFormData.isActive}
                  onValueChange={(value) => {
                    setUserFormData(prev => ({ ...prev, isActive: value }));
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  trackColor={{ false: theme.colors.gray[600], true: theme.colors.primary[600] }}
                  thumbColor={userFormData.isActive ? theme.colors.primary[400] : theme.colors.gray[400]}
                />
              </View>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <Button
              variant="secondary"
              onPress={() => setShowUserModal(false)}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onPress={editingUser ? handleUpdateUser : handleCreateUser}
              loading={submitLoading}
              style={styles.saveButton}
            >
              <Save size={16} color={theme.colors.white} />
              <Text style={styles.saveButtonText}>
                {editingUser ? 'Update' : 'Create'}
              </Text>
            </Button>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Role Modal */}
      <Modal
        visible={showRoleModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowRoleModal(false)}>
              <X size={24} color={theme.colors.gray[400]} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingRole ? 'Edit Role' : 'Create Role'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Role Name *</Text>
              <Input
                value={roleFormData.name}
                onChangeText={(value) => setRoleFormData(prev => ({ ...prev, name: value }))}
                placeholder="Enter role name"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Description *</Text>
              <Input
                value={roleFormData.description}
                onChangeText={(value) => setRoleFormData(prev => ({ ...prev, description: value }))}
                placeholder="Enter role description"
                multiline
                numberOfLines={3}
              />
            </View>

            {renderPermissionMatrix()}

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <Button
              variant="secondary"
              onPress={() => setShowRoleModal(false)}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onPress={editingRole ? handleUpdateRole : handleCreateRole}
              loading={submitLoading}
              style={styles.saveButton}
            >
              <Save size={16} color={theme.colors.white} />
              <Text style={styles.saveButtonText}>
                {editingRole ? 'Update' : 'Create'}
              </Text>
            </Button>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark[950],
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray[400],
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.dark[900],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  activeTab: {
    backgroundColor: theme.colors.primary[600],
  },
  tabText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  activeTabText: {
    color: theme.colors.white,
  },
  inactiveTabText: {
    color: theme.colors.gray[400],
  },
  controlsCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.dark[900],
    borderColor: theme.colors.dark[700],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  searchInput: {
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  addButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  userCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.dark[900],
    borderColor: theme.colors.dark[700],
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
    marginBottom: theme.spacing.xs,
  },
  userRole: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.blue[400],
  },
  userMeta: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  activeBadge: {
    backgroundColor: theme.colors.green[950],
  },
  inactiveBadge: {
    backgroundColor: theme.colors.gray[800],
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  activeText: {
    color: theme.colors.green[400],
  },
  inactiveText: {
    color: theme.colors.gray[400],
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: theme.colors.dark[700],
    paddingTop: theme.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
  },
  actionButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  roleCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.dark[900],
    borderColor: theme.colors.dark[700],
  },
  roleHeader: {
    marginBottom: theme.spacing.md,
  },
  roleInfo: {
    gap: theme.spacing.sm,
  },
  roleNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  roleName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  defaultBadge: {
    backgroundColor: theme.colors.blue[950],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  defaultText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.blue[400],
  },
  roleDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[400],
    lineHeight: 20,
  },
  rolePermissions: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary[400],
  },
  roleActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: theme.colors.dark[700],
    paddingTop: theme.spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray[400],
  },
  errorCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.red[950],
    borderColor: theme.colors.red[800],
  },
  errorText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.red[400],
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  retryButton: {
    paddingHorizontal: theme.spacing.lg,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.gray[400],
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[500],
    textAlign: 'center',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.dark[950],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.dark[800],
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  formSection: {
    marginBottom: theme.spacing.lg,
  },
  fieldLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.gray[300],
    marginBottom: theme.spacing.sm,
  },
  roleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  roleOption: {
    backgroundColor: theme.colors.dark[800],
    borderWidth: 1,
    borderColor: theme.colors.dark[600],
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  roleOptionSelected: {
    backgroundColor: theme.colors.primary[600],
    borderColor: theme.colors.primary[500],
  },
  roleOptionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[300],
  },
  roleOptionTextSelected: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.medium,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  permissionMatrix: {
    gap: theme.spacing.md,
  },
  permissionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
  },
  permissionResource: {
    gap: theme.spacing.sm,
  },
  resourceName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.gray[300],
  },
  permissionActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  permissionChip: {
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
  },
  permissionChipSelected: {
    backgroundColor: theme.colors.primary[600],
    borderColor: theme.colors.primary[500],
  },
  permissionChipUnselected: {
    backgroundColor: theme.colors.dark[800],
    borderColor: theme.colors.dark[600],
  },
  permissionChipText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  permissionChipTextSelected: {
    color: theme.colors.white,
  },
  permissionChipTextUnselected: {
    color: theme.colors.gray[400],
  },
  errorContainer: {
    backgroundColor: theme.colors.red[950],
    borderColor: theme.colors.red[800],
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.dark[800],
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  saveButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.white,
  },
}); 