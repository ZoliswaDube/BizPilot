#!/bin/bash

# BizPilot Mobile - Automated Deployment Script
# This script handles building and deploying the mobile app to various environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="BizPilot Mobile"
BUNDLE_ID="com.bizpilot.mobile"
BUILD_PATH="./build"
LOG_FILE="deployment.log"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ required. Current version: $(node -v)"
        exit 1
    fi
    
    # Check if Expo CLI is installed
    if ! command -v expo &> /dev/null; then
        print_warning "Expo CLI not found. Installing..."
        npm install -g @expo/cli
    fi
    
    # Check if EAS CLI is installed
    if ! command -v eas &> /dev/null; then
        print_warning "EAS CLI not found. Installing..."
        npm install -g eas-cli
    fi
    
    print_success "Prerequisites check completed"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    print_success "Dependencies installed"
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    
    # Run unit tests
    npm run test -- --coverage --watchAll=false
    
    # Run linting
    npm run lint
    
    print_success "All tests passed"
}

# Function to build for development
build_development() {
    print_status "Building for development..."
    
    # Create development build
    expo export --platform all --output-dir $BUILD_PATH/dev
    
    print_success "Development build completed"
}

# Function to build for staging
build_staging() {
    print_status "Building for staging..."
    
    # Build for internal distribution
    eas build --platform all --profile preview --non-interactive
    
    print_success "Staging build completed"
}

# Function to build for production
build_production() {
    print_status "Building for production..."
    
    # Validate version bump
    if [ -z "$VERSION" ]; then
        print_error "VERSION environment variable not set"
        print_status "Usage: VERSION=1.0.1 ./scripts/deploy.sh production"
        exit 1
    fi
    
    # Update version in app.json and package.json
    print_status "Updating version to $VERSION..."
    
    # Update package.json version
    npm version $VERSION --no-git-tag-version
    
    # Update app.json version
    if command -v jq &> /dev/null; then
        jq --arg version "$VERSION" '.expo.version = $version' app.json > app.json.tmp && mv app.json.tmp app.json
    else
        print_warning "jq not found. Please manually update version in app.json"
    fi
    
    # Build for production
    eas build --platform all --profile production --non-interactive
    
    print_success "Production build completed"
}

# Function to submit to app stores
submit_to_stores() {
    print_status "Submitting to app stores..."
    
    # Submit to iOS App Store
    print_status "Submitting to iOS App Store..."
    eas submit --platform ios --latest
    
    # Submit to Google Play Store
    print_status "Submitting to Google Play Store..."
    eas submit --platform android --latest
    
    print_success "Submitted to app stores"
}

# Function to deploy to Expo
deploy_expo() {
    print_status "Deploying to Expo..."
    
    # Publish update
    eas update --branch production --message "Production deployment $(date)"
    
    print_success "Deployed to Expo"
}

# Function to create deployment artifacts
create_artifacts() {
    print_status "Creating deployment artifacts..."
    
    mkdir -p $BUILD_PATH/artifacts
    
    # Copy important files
    cp app.json $BUILD_PATH/artifacts/
    cp package.json $BUILD_PATH/artifacts/
    cp eas.json $BUILD_PATH/artifacts/
    
    # Create build info
    cat > $BUILD_PATH/artifacts/build-info.json << EOF
{
  "app_name": "$APP_NAME",
  "bundle_id": "$BUNDLE_ID",
  "version": "$(node -p "require('./package.json').version")",
  "build_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
  "environment": "$ENVIRONMENT"
}
EOF
    
    print_success "Deployment artifacts created"
}

# Function to send notifications
send_notifications() {
    print_status "Sending deployment notifications..."
    
    # Slack notification (if webhook URL is set)
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
             --data "{\"text\":\"🚀 $APP_NAME deployed to $ENVIRONMENT\"}" \
             $SLACK_WEBHOOK_URL
    fi
    
    # Email notification (if configured)
    if [ ! -z "$EMAIL_RECIPIENTS" ]; then
        echo "Deployment of $APP_NAME to $ENVIRONMENT completed successfully" | \
        mail -s "Deployment Notification" $EMAIL_RECIPIENTS
    fi
    
    print_success "Notifications sent"
}

# Function to cleanup
cleanup() {
    print_status "Cleaning up temporary files..."
    
    # Remove temporary files
    rm -rf node_modules/.cache
    rm -rf .expo
    
    print_success "Cleanup completed"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [ENVIRONMENT] [OPTIONS]"
    echo ""
    echo "Environments:"
    echo "  dev         - Development build"
    echo "  staging     - Staging build for internal testing"
    echo "  production  - Production build for app stores"
    echo ""
    echo "Options:"
    echo "  --skip-tests    Skip running tests"
    echo "  --skip-build    Skip building (for testing deployment steps)"
    echo "  --submit        Submit to app stores (production only)"
    echo "  --update        Deploy OTA update via Expo"
    echo ""
    echo "Environment Variables:"
    echo "  VERSION             Version number for production builds"
    echo "  SLACK_WEBHOOK_URL   Slack webhook for notifications"
    echo "  EMAIL_RECIPIENTS    Email addresses for notifications"
    echo ""
    echo "Examples:"
    echo "  $0 dev"
    echo "  $0 staging"
    echo "  VERSION=1.0.1 $0 production --submit"
    echo "  $0 production --update"
}

# Parse command line arguments
ENVIRONMENT="$1"
SKIP_TESTS=false
SKIP_BUILD=false
SUBMIT=false
UPDATE=false

shift || true

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --submit)
            SUBMIT=true
            shift
            ;;
        --update)
            UPDATE=true
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate environment
if [ -z "$ENVIRONMENT" ]; then
    print_error "Environment not specified"
    show_usage
    exit 1
fi

if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|production)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    show_usage
    exit 1
fi

# Main deployment flow
main() {
    print_status "Starting deployment for $ENVIRONMENT environment"
    echo "$(date): Starting deployment for $ENVIRONMENT" >> $LOG_FILE
    
    # Check prerequisites
    check_prerequisites
    
    # Install dependencies
    install_dependencies
    
    # Run tests (unless skipped)
    if [ "$SKIP_TESTS" = false ]; then
        run_tests
    else
        print_warning "Skipping tests"
    fi
    
    # Build (unless skipped)
    if [ "$SKIP_BUILD" = false ]; then
        case $ENVIRONMENT in
            dev)
                build_development
                ;;
            staging)
                build_staging
                ;;
            production)
                build_production
                ;;
        esac
    else
        print_warning "Skipping build"
    fi
    
    # Create artifacts
    create_artifacts
    
    # Submit to stores (if requested and production)
    if [ "$SUBMIT" = true ] && [ "$ENVIRONMENT" = "production" ]; then
        submit_to_stores
    fi
    
    # Deploy OTA update (if requested)
    if [ "$UPDATE" = true ]; then
        deploy_expo
    fi
    
    # Send notifications
    send_notifications
    
    # Cleanup
    cleanup
    
    print_success "Deployment completed successfully!"
    echo "$(date): Deployment completed successfully" >> $LOG_FILE
}

# Error handling
trap 'print_error "Deployment failed! Check $LOG_FILE for details"; exit 1' ERR

# Run main function
main

print_success "All done! 🎉" 