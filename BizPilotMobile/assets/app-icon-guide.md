# App Icon and Splash Screen Guide

## Required Assets

### App Icons

#### iOS
- **App Store**: 1024x1024px (PNG, no transparency)
- **Home Screen**: 180x180px (@3x), 120x120px (@2x), 60x60px (@1x)
- **Settings**: 87x87px (@3x), 58x58px (@2x), 29x29px (@1x)
- **Spotlight**: 120x120px (@3x), 80x80px (@2x), 40x40px (@1x)
- **Notification**: 60x60px (@3x), 40x40px (@2x), 20x20px (@1x)

#### Android
- **Play Store**: 512x512px (PNG)
- **Launcher Icons**: 192x192px (XXXHDPI), 144x144px (XXHDPI), 96x96px (XHDPI), 72x72px (HDPI), 48x48px (MDPI)
- **Adaptive Icon**: 108x108px foreground + background layers
- **Notification**: 96x96px (XXXHDPI), 72x72px (XXHDPI), 48x48px (XHDPI), 36x36px (HDPI), 24x24px (MDPI)

### Splash Screens

#### iOS
- **iPhone 14 Pro Max**: 1290x2796px
- **iPhone 14 Pro**: 1179x2556px
- **iPhone 14 Plus**: 1284x2778px
- **iPhone 14**: 1170x2532px
- **iPhone SE 3rd Gen**: 750x1334px
- **iPad Pro 12.9"**: 2048x2732px
- **iPad Pro 11"**: 1668x2388px

#### Android
- **Generic**: 1080x1920px (portrait), 1920x1080px (landscape)
- **Various densities**: XXXHDPI, XXHDPI, XHDPI, HDPI, MDPI

## Design Guidelines

### Brand Colors
```
Primary: #8b5cf6 (Purple)
Secondary: #ec4899 (Pink)
Background: #020617 (Dark Blue)
Text: #ffffff (White)
Accent: #fbbf24 (Yellow)
```

### Icon Design Principles

#### BizPilot Icon Concept
1. **Symbol**: Stylized "BP" monogram or pilot wings
2. **Style**: Modern, minimalist, professional
3. **Colors**: Use brand gradient (purple to pink)
4. **Shape**: Rounded rectangle or circle for modern feel

#### Design Requirements
- **Scalability**: Must be legible at 16x16px
- **Contrast**: High contrast against various backgrounds
- **Simplicity**: Avoid fine details that disappear when small
- **Consistency**: Match brand identity and app purpose

### Splash Screen Design

#### Content
- **Logo**: Centered BizPilot logo
- **Background**: Brand dark blue (#020617)
- **Loading**: Subtle loading indicator below logo
- **Tagline**: "Business Management Made Simple" (optional)

#### Layout
- **Safe Area**: Keep content within safe zones
- **Centering**: Vertically and horizontally centered
- **Spacing**: Adequate padding from screen edges
- **Orientation**: Support both portrait and landscape

## Creation Tools

### Professional Tools
- **Adobe Illustrator**: Vector design for scalability
- **Sketch**: UI/UX design tool
- **Figma**: Collaborative design platform
- **Adobe Photoshop**: Raster editing and effects

### Free Alternatives
- **GIMP**: Free photo editing
- **Inkscape**: Free vector graphics
- **Canva**: Online design tool
- **IconScout**: Icon generator service

### Automated Tools
- **App Icon Generator**: makeappicon.com
- **Icon Slate**: macOS icon generator
- **Asset Catalog Creator**: Xcode tool
- **Android Asset Studio**: Google's icon tool

## File Organization

```
assets/
├── icon-source.ai              # Source file (Adobe Illustrator)
├── icon.png                    # 1024x1024 master icon
├── adaptive-icon.png           # Android adaptive icon
├── favicon.png                 # Web favicon
├── splash.png                  # Splash screen image
├── notification-icon.png       # Notification icon
├── ios-icons/                  # iOS specific sizes
│   ├── icon-29.png
│   ├── icon-40.png
│   ├── icon-58.png
│   ├── icon-60.png
│   ├── icon-80.png
│   ├── icon-87.png
│   ├── icon-120.png
│   ├── icon-180.png
│   └── icon-1024.png
├── android-icons/              # Android specific sizes
│   ├── mipmap-mdpi/
│   ├── mipmap-hdpi/
│   ├── mipmap-xhdpi/
│   ├── mipmap-xxhdpi/
│   └── mipmap-xxxhdpi/
└── splash-screens/             # Various splash sizes
    ├── splash-1170x2532.png    # iPhone 14
    ├── splash-1284x2778.png    # iPhone 14 Plus
    └── splash-1080x1920.png    # Android
```

## Implementation Steps

### 1. Design Master Icon
- Create 1024x1024px icon in vector format
- Use brand colors and BizPilot identity
- Ensure clarity at small sizes
- Export high-resolution PNG

### 2. Generate All Sizes
- Use automated tools or manual resizing
- Create platform-specific variants
- Test on actual devices
- Optimize file sizes

### 3. Design Splash Screen
- Create master 1080x1920px design
- Use brand background color
- Center logo and loading elements
- Create responsive variants

### 4. Update App Configuration
```json
// app.json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#020617"
    },
    "ios": {
      "icon": "./assets/icon.png"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#020617"
      }
    }
  }
}
```

### 5. Test and Validate
- Build app with new assets
- Test on various devices and screen sizes
- Verify all icons appear correctly
- Check app store requirements

## Quality Checklist

### Icon Quality
- [ ] 1024x1024px master file created
- [ ] All required sizes generated
- [ ] Icons are crisp and legible
- [ ] Brand colors used correctly
- [ ] No transparency issues
- [ ] Platform guidelines followed

### Splash Screen Quality
- [ ] Brand background color used
- [ ] Logo properly centered
- [ ] Loading indicator included
- [ ] Multiple device sizes supported
- [ ] Fast loading time
- [ ] Matches app theme

### Technical Requirements
- [ ] PNG format for most assets
- [ ] Proper file naming convention
- [ ] Optimized file sizes
- [ ] No copyrighted content
- [ ] Platform-specific variants
- [ ] App store compliance

## Resources

### Design Inspiration
- **Dribbble**: dribbble.com/tags/app_icon
- **Behance**: behance.net/search/projects?search=mobile%20app%20icon
- **IconScout**: iconscout.com/blog/mobile-app-icon-design

### Guidelines
- **Apple HIG**: developer.apple.com/design/human-interface-guidelines/app-icons
- **Material Design**: material.io/design/iconography/product-icons.html
- **Expo Docs**: docs.expo.dev/guides/app-icons/

### Validation Tools
- **App Store Connect**: For iOS submission
- **Google Play Console**: For Android submission
- **Expo Build**: expo build validation
- **IconScout Validator**: Online icon checker 