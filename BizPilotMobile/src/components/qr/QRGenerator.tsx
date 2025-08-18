import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import {
  QrCode,
  Share as ShareIcon,
  Download,
  Copy,
  Scan,
  Palette,
  Settings,
  Wifi,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  Camera,
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Clipboard from 'expo-clipboard';
import { useAnalytics } from '../../hooks/useAnalytics';
import { mcp_supabase_execute_sql } from '../../services/mcpClient';
import { useAuthStore } from '../../store/auth';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { theme } from '../../styles/theme';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const QR_SIZE = Math.min(screenWidth - 80, 280);

interface QRCodeData {
  id: string;
  type: QRCodeType;
  title: string;
  content: string;
  data: any;
  color: string;
  backgroundColor: string;
  created_at: string;
}

type QRCodeType = 
  | 'text'
  | 'url'
  | 'wifi'
  | 'contact'
  | 'sms'
  | 'email'
  | 'phone'
  | 'location'
  | 'payment'
  | 'product'
  | 'business';

interface QRCodeTemplate {
  type: QRCodeType;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  fields: Array<{
    key: string;
    label: string;
    placeholder: string;
    type?: 'text' | 'email' | 'tel' | 'url' | 'number';
    required?: boolean;
  }>;
}

const QR_TEMPLATES: QRCodeTemplate[] = [
  {
    type: 'text',
    title: 'Plain Text',
    description: 'Simple text message',
    icon: FileText,
    fields: [
      { key: 'text', label: 'Text Content', placeholder: 'Enter your text', required: true },
    ],
  },
  {
    type: 'url',
    title: 'Website URL',
    description: 'Link to website or webpage',
    icon: Globe,
    fields: [
      { key: 'url', label: 'Website URL', placeholder: 'https://example.com', type: 'url', required: true },
    ],
  },
  {
    type: 'wifi',
    title: 'WiFi Network',
    description: 'Connect to WiFi network',
    icon: Wifi,
    fields: [
      { key: 'ssid', label: 'Network Name (SSID)', placeholder: 'My WiFi Network', required: true },
      { key: 'password', label: 'Password', placeholder: 'Enter password' },
      { key: 'security', label: 'Security Type', placeholder: 'WPA/WEP/nopass' },
    ],
  },
  {
    type: 'contact',
    title: 'Contact Card',
    description: 'Share contact information',
    icon: Phone,
    fields: [
      { key: 'name', label: 'Full Name', placeholder: 'John Doe', required: true },
      { key: 'phone', label: 'Phone Number', placeholder: '+1 234 567 8900', type: 'tel' },
      { key: 'email', label: 'Email Address', placeholder: 'john@example.com', type: 'email' },
      { key: 'organization', label: 'Organization', placeholder: 'Company Name' },
      { key: 'url', label: 'Website', placeholder: 'https://example.com', type: 'url' },
    ],
  },
  {
    type: 'sms',
    title: 'SMS Message',
    description: 'Pre-filled text message',
    icon: Phone,
    fields: [
      { key: 'phone', label: 'Phone Number', placeholder: '+1 234 567 8900', type: 'tel', required: true },
      { key: 'message', label: 'Message', placeholder: 'Enter your message' },
    ],
  },
  {
    type: 'email',
    title: 'Email',
    description: 'Pre-filled email message',
    icon: Mail,
    fields: [
      { key: 'email', label: 'Email Address', placeholder: 'recipient@example.com', type: 'email', required: true },
      { key: 'subject', label: 'Subject', placeholder: 'Email subject' },
      { key: 'body', label: 'Message', placeholder: 'Email message body' },
    ],
  },
  {
    type: 'location',
    title: 'Location',
    description: 'GPS coordinates or address',
    icon: MapPin,
    fields: [
      { key: 'latitude', label: 'Latitude', placeholder: '40.7128', type: 'number' },
      { key: 'longitude', label: 'Longitude', placeholder: '-74.0060', type: 'number' },
      { key: 'address', label: 'Address', placeholder: 'New York, NY, USA' },
    ],
  },
  {
    type: 'payment',
    title: 'Payment',
    description: 'Payment request or link',
    icon: CreditCard,
    fields: [
      { key: 'amount', label: 'Amount', placeholder: '10.00', type: 'number', required: true },
      { key: 'currency', label: 'Currency', placeholder: 'USD' },
      { key: 'description', label: 'Description', placeholder: 'Payment for...' },
      { key: 'recipient', label: 'Recipient', placeholder: 'Business name' },
    ],
  },
];

const QR_COLORS = [
  '#000000', '#1F2937', '#374151', '#4B5563',
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
];

export function QRGenerator() {
  useAnalytics('QR Generator');
  
  const { user } = useAuthStore();
  const [selectedTemplate, setSelectedTemplate] = useState<QRCodeTemplate>(QR_TEMPLATES[0]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [generatedQRCode, setGeneratedQRCode] = useState<string | null>(null);
  const [qrTitle, setQRTitle] = useState('');
  const [qrColor, setQRColor] = useState('#000000');
  const [qrBackgroundColor, setQRBackgroundColor] = useState('#FFFFFF');
  const [savedQRCodes, setSavedQRCodes] = useState<QRCodeData[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCameraPermissions();
    fetchSavedQRCodes();
  }, []);

  const getCameraPermissions = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const fetchSavedQRCodes = async () => {
    try {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT * FROM qr_codes 
          WHERE business_id = $1 
          ORDER BY created_at DESC
        `,
        params: [user?.business_id || 'demo-business']
      });

      if (result.success && result.data) {
        setSavedQRCodes(result.data);
      } else {
        // Mock data for development
        const mockQRCodes: QRCodeData[] = [
          {
            id: '1',
            type: 'url',
            title: 'Business Website',
            content: 'https://mybusiness.com',
            data: { url: 'https://mybusiness.com' },
            color: '#000000',
            backgroundColor: '#FFFFFF',
            created_at: new Date().toISOString(),
          },
          {
            id: '2',
            type: 'wifi',
            title: 'Shop WiFi',
            content: 'WIFI:T:WPA;S:ShopWiFi;P:password123;H:false;',
            data: { ssid: 'ShopWiFi', password: 'password123', security: 'WPA' },
            color: '#3B82F6',
            backgroundColor: '#FFFFFF',
            created_at: new Date().toISOString(),
          },
        ];
        setSavedQRCodes(mockQRCodes);
      }
    } catch (err) {
      console.error('Error fetching saved QR codes:', err);
    }
  };

  const generateQRContent = (template: QRCodeTemplate, data: Record<string, string>): string => {
    switch (template.type) {
      case 'text':
        return data.text || '';
      
      case 'url':
        return data.url || '';
      
      case 'wifi':
        return `WIFI:T:${data.security || 'WPA'};S:${data.ssid};P:${data.password};H:false;`;
      
      case 'contact':
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${data.name}\nTEL:${data.phone}\nEMAIL:${data.email}\nORG:${data.organization}\nURL:${data.url}\nEND:VCARD`;
      
      case 'sms':
        return `sms:${data.phone}?body=${encodeURIComponent(data.message || '')}`;
      
      case 'email':
        return `mailto:${data.email}?subject=${encodeURIComponent(data.subject || '')}&body=${encodeURIComponent(data.body || '')}`;
      
      case 'location':
        if (data.latitude && data.longitude) {
          return `geo:${data.latitude},${data.longitude}`;
        }
        return `geo:0,0?q=${encodeURIComponent(data.address || '')}`;
      
      case 'payment':
        return `upi://pay?pa=business@upi&pn=${encodeURIComponent(data.recipient || '')}&am=${data.amount}&cu=${data.currency || 'USD'}&tn=${encodeURIComponent(data.description || '')}`;
      
      default:
        return data.text || '';
    }
  };

  const handleGenerateQR = () => {
    const content = generateQRContent(selectedTemplate, formData);
    if (!content.trim()) {
      Alert.alert('Invalid Data', 'Please fill in the required fields.');
      return;
    }

    setGeneratedQRCode(content);
    if (Platform.OS !== 'web' && (Haptics as any)?.impactAsync) {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
    }
  };

  const handleSaveQR = async () => {
    if (!generatedQRCode || !qrTitle.trim()) {
      Alert.alert('Missing Information', 'Please generate a QR code and enter a title.');
      return;
    }

    try {
      setLoading(true);
      const result = await mcp_supabase_execute_sql({
        query: `
          INSERT INTO qr_codes (business_id, type, title, content, data, color, background_color, created_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `,
        params: [
          user?.business_id || 'demo-business',
          selectedTemplate.type,
          qrTitle.trim(),
          generatedQRCode,
          JSON.stringify(formData),
          qrColor,
          qrBackgroundColor,
          user?.id || 'demo-user'
        ]
      });

      if (result.success) {
        await fetchSavedQRCodes();
        setQRTitle('');
        if (Platform.OS !== 'web' && (Haptics as any)?.impactAsync) {
          try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
        }
        Alert.alert('Success', 'QR code saved successfully!');
      } else {
        Alert.alert('Error', 'Failed to save QR code');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to save QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleShareQR = async () => {
    if (!generatedQRCode) return;

    try {
      await Share.share({
        message: `Check out this QR code: ${generatedQRCode}`,
        title: qrTitle || 'QR Code',
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to share QR code');
    }
  };

  const handleCopyContent = async () => {
    if (!generatedQRCode) return;

    try {
      await Clipboard.setStringAsync(generatedQRCode);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert('Copied', 'QR code content copied to clipboard');
    } catch (err) {
      Alert.alert('Error', 'Failed to copy content');
    }
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScannedData(data);
    setShowScanner(false);
    if (Platform.OS !== 'web' && (Haptics as any)?.impactAsync) {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
    }
    
    Alert.alert(
      'QR Code Scanned',
      `Type: ${type}\n\nContent: ${data}`,
      [
        { text: 'Copy Content', onPress: () => Clipboard.setStringAsync(data) },
        { text: 'OK' },
      ]
    );
  };

  const renderTemplateSelector = () => (
    <View style={styles.templateGrid}>
      {QR_TEMPLATES.map((template) => {
        const IconComponent = template.icon;
        const isSelected = selectedTemplate.type === template.type;
        
        return (
          <TouchableOpacity
            key={template.type}
            style={[styles.templateCard, isSelected && styles.templateCardSelected]}
            onPress={() => {
              setSelectedTemplate(template);
              setFormData({});
              setGeneratedQRCode(null);
              if (Platform.OS !== 'web' && (Haptics as any)?.impactAsync) {
                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
              }
            }}
          >
            <IconComponent 
              size={24} 
              color={isSelected ? theme.colors.white : theme.colors.gray[400]} 
            />
            <Text style={[
              styles.templateTitle,
              isSelected ? styles.templateTitleSelected : styles.templateTitleUnselected
            ]}>
              {template.title}
            </Text>
            <Text style={[
              styles.templateDescription,
              isSelected ? styles.templateDescriptionSelected : styles.templateDescriptionUnselected
            ]}>
              {template.description}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderFormFields = () => (
    <View style={styles.formFields}>
      {selectedTemplate.fields.map((field) => (
        <View key={field.key} style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>
            {field.label}
            {field.required && <Text style={styles.requiredMark}> *</Text>}
          </Text>
          <Input
            value={formData[field.key] || ''}
            onChangeText={(value) => setFormData(prev => ({ ...prev, [field.key]: value }))}
            placeholder={field.placeholder}
            keyboardType={field.type === 'email' ? 'email-address' : field.type === 'tel' ? 'phone-pad' : field.type === 'number' ? 'numeric' : 'default'}
            autoCapitalize={field.type === 'email' || field.type === 'url' ? 'none' : 'sentences'}
            multiline={field.key === 'message' || field.key === 'body'}
            numberOfLines={field.key === 'message' || field.key === 'body' ? 3 : 1}
          />
        </View>
      ))}
    </View>
  );

  const renderColorPicker = () => (
    <View style={styles.colorSection}>
      <Text style={styles.sectionTitle}>Customization</Text>
      
      <View style={styles.colorPicker}>
        <Text style={styles.colorLabel}>QR Code Color</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorList}>
          {QR_COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                qrColor === color && styles.colorOptionSelected
              ]}
              onPress={() => {
                setQRColor(color);
                if (Platform.OS !== 'web' && (Haptics as any)?.impactAsync) {
                  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                }
              }}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderQRCodeDisplay = () => {
    if (!generatedQRCode) return null;

    return (
      <Card style={styles.qrDisplayCard}>
        <View style={styles.qrCodeContainer}>
          <QRCode
            value={generatedQRCode}
            size={QR_SIZE}
            color={qrColor}
            backgroundColor={qrBackgroundColor}
            logoSize={30}
          />
        </View>
        
        <View style={styles.qrTitleContainer}>
          <Input
            value={qrTitle}
            onChangeText={setQRTitle}
            placeholder="Enter QR code title (optional)"
            style={styles.qrTitleInput}
          />
        </View>

        <View style={styles.qrActions}>
          <TouchableOpacity style={styles.qrActionButton} onPress={handleCopyContent}>
            <Copy size={16} color={theme.colors.blue[500]} />
            <Text style={[styles.qrActionText, { color: theme.colors.blue[500] }]}>Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.qrActionButton} onPress={handleShareQR}>
            <ShareIcon size={16} color={theme.colors.green[500]} />
            <Text style={[styles.qrActionText, { color: theme.colors.green[500] }]}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.qrActionButton} onPress={handleSaveQR}>
            <Download size={16} color={theme.colors.purple[500]} />
            <Text style={[styles.qrActionText, { color: theme.colors.purple[500] }]}>Save</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderSavedQRCodes = () => {
    if (savedQRCodes.length === 0) return null;

    return (
      <View style={styles.savedSection}>
        <Text style={styles.sectionTitle}>Saved QR Codes</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedList}>
          {savedQRCodes.map((qr) => (
            <Card key={qr.id} style={styles.savedQRCard}>
              <View style={styles.savedQRContainer}>
                <QRCode
                  value={qr.content}
                  size={80}
                  color={qr.color}
                  backgroundColor={qr.backgroundColor}
                />
              </View>
              <Text style={styles.savedQRTitle} numberOfLines={1}>
                {qr.title}
              </Text>
              <Text style={styles.savedQRType}>
                {QR_TEMPLATES.find(t => t.type === qr.type)?.title || qr.type}
              </Text>
            </Card>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (showScanner) {
    return (
      <SafeAreaView style={styles.scannerContainer}>
        <View style={styles.scannerHeader}>
          <TouchableOpacity onPress={() => setShowScanner(false)}>
            <Text style={styles.scannerCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.scannerTitle}>Scan QR Code</Text>
          <View style={{ width: 60 }} />
        </View>
        
        {hasPermission === null ? (
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionText}>Requesting camera permission...</Text>
          </View>
        ) : hasPermission === false ? (
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionText}>No access to camera</Text>
            <Button variant="primary" onPress={getCameraPermissions} style={styles.permissionButton}>
              Grant Permission
            </Button>
          </View>
        ) : (
          <BarCodeScanner
            onBarCodeScanned={handleBarCodeScanned}
            style={styles.scanner}
          />
        )}
        
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerFrame} />
          <Text style={styles.scannerInstructions}>
            Position the QR code within the frame to scan
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>QR Generator</Text>
        <Text style={styles.subtitle}>Create and scan QR codes</Text>
      </View>

      {/* Scanner Button */}
      <Card style={styles.scannerButtonCard}>
        <Button
          variant="secondary"
          onPress={() => setShowScanner(true)}
          style={styles.scannerButton}
        >
          <Scan size={16} color={theme.colors.primary[500]} />
          <Text style={styles.scannerButtonText}>Scan QR Code</Text>
        </Button>
      </Card>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Template Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select QR Code Type</Text>
          {renderTemplateSelector()}
        </View>

        {/* Form Fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enter Information</Text>
          {renderFormFields()}
        </View>

        {/* Customization */}
        {renderColorPicker()}

        {/* Generate Button */}
        <Button
          variant="primary"
          onPress={handleGenerateQR}
          style={styles.generateButton}
        >
          <QrCode size={16} color={theme.colors.white} />
          <Text style={styles.generateButtonText}>Generate QR Code</Text>
        </Button>

        {/* QR Code Display */}
        {renderQRCodeDisplay()}

        {/* Saved QR Codes */}
        {renderSavedQRCodes()}
      </ScrollView>
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
  scannerButtonCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.dark[900],
    borderColor: theme.colors.dark[700],
  },
  scannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  scannerButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary[500],
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
    marginBottom: theme.spacing.md,
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  templateCard: {
    width: (screenWidth - theme.spacing.lg * 2 - theme.spacing.md) / 2,
    backgroundColor: theme.colors.dark[800],
    borderWidth: 1,
    borderColor: theme.colors.dark[600],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  templateCardSelected: {
    backgroundColor: theme.colors.primary[600],
    borderColor: theme.colors.primary[500],
  },
  templateTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    textAlign: 'center',
  },
  templateTitleSelected: {
    color: theme.colors.white,
  },
  templateTitleUnselected: {
    color: theme.colors.gray[300],
  },
  templateDescription: {
    fontSize: theme.fontSize.xs,
    textAlign: 'center',
    lineHeight: 16,
  },
  templateDescriptionSelected: {
    color: theme.colors.primary[100],
  },
  templateDescriptionUnselected: {
    color: theme.colors.gray[400],
  },
  formFields: {
    gap: theme.spacing.md,
  },
  fieldContainer: {
    gap: theme.spacing.sm,
  },
  fieldLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.gray[300],
  },
  requiredMark: {
    color: theme.colors.red[400],
  },
  colorSection: {
    marginBottom: theme.spacing.xl,
  },
  colorPicker: {
    gap: theme.spacing.sm,
  },
  colorLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.gray[300],
  },
  colorList: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: theme.colors.white,
    borderWidth: 3,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  generateButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.white,
  },
  qrDisplayCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.dark[900],
    borderColor: theme.colors.dark[700],
    marginBottom: theme.spacing.xl,
  },
  qrCodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  qrTitleContainer: {
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  qrTitleInput: {
    textAlign: 'center',
  },
  qrActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: theme.colors.dark[700],
    paddingTop: theme.spacing.md,
  },
  qrActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
  },
  qrActionText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  savedSection: {
    marginBottom: theme.spacing.xl,
  },
  savedList: {
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  savedQRCard: {
    width: 120,
    alignItems: 'center',
    backgroundColor: theme.colors.dark[800],
    borderColor: theme.colors.dark[600],
  },
  savedQRContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  savedQRTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.white,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  savedQRType: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[400],
    textAlign: 'center',
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: theme.colors.dark[950],
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.dark[800],
  },
  scannerCancel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary[500],
  },
  scannerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  scanner: {
    flex: 1,
  },
  scannerOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -100 }],
    alignItems: 'center',
  },
  scannerFrame: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: theme.colors.primary[500],
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'transparent',
  },
  scannerInstructions: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.white,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  permissionText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray[400],
    textAlign: 'center',
  },
  permissionButton: {
    paddingHorizontal: theme.spacing.xl,
  },
}); 