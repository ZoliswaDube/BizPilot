// Demo authentication service for development/testing when Supabase is not configured

export interface DemoUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface DemoBusiness {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
}

export interface DemoSession {
  access_token: string;
  user: DemoUser;
}

class DemoAuthService {
  private currentSession: DemoSession | null = null;
  private users: Map<string, { user: DemoUser; password: string; business: DemoBusiness }> = new Map();

  constructor() {
    // Pre-populate with demo users
    this.users.set('demo@bizpilot.com', {
      user: {
        id: 'demo-user-1',
        email: 'demo@bizpilot.com',
        full_name: 'Demo User',
        avatar_url: null,
      },
      password: 'demo123',
      business: {
        id: 'demo-business-1',
        name: 'Demo Business',
        description: 'A demonstration business for testing BizPilot',
        address: '123 Demo Street, Demo City, DC 12345',
        phone: '+1 (555) 123-4567',
        email: 'contact@demobusiness.com',
        logo_url: null,
      },
    });

    this.users.set('admin@bizpilot.com', {
      user: {
        id: 'demo-user-2',
        email: 'admin@bizpilot.com',
        full_name: 'Admin User',
        avatar_url: null,
      },
      password: 'admin123',
      business: {
        id: 'demo-business-2',
        name: 'Admin Business',
        description: 'Administrator business account',
        address: '456 Admin Avenue, Admin City, AC 67890',
        phone: '+1 (555) 987-6543',
        email: 'admin@adminbusiness.com',
        logo_url: null,
      },
    });
  }

  async signInWithPassword(email: string, password: string): Promise<{ data: { session: DemoSession | null; user: DemoUser | null }; error: any }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const userData = this.users.get(email.toLowerCase());
    
    if (!userData || userData.password !== password) {
      return {
        data: { session: null, user: null },
        error: { message: 'Invalid email or password' }
      };
    }

    const session: DemoSession = {
      access_token: `demo_token_${Date.now()}`,
      user: userData.user,
    };

    this.currentSession = session;

    return {
      data: { session, user: userData.user },
      error: null
    };
  }

  async signUp(email: string, password: string, fullName?: string): Promise<{ data: { session: DemoSession | null; user: DemoUser | null }; error: any }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Check if user already exists
    if (this.users.has(email.toLowerCase())) {
      return {
        data: { session: null, user: null },
        error: { message: 'User already registered' }
      };
    }

    // Create new user
    const newUser: DemoUser = {
      id: `demo-user-${Date.now()}`,
      email: email.toLowerCase(),
      full_name: fullName || null,
      avatar_url: null,
    };

    const newBusiness: DemoBusiness = {
      id: `demo-business-${Date.now()}`,
      name: `${fullName || 'User'}'s Business`,
      description: 'A new business created with BizPilot',
      address: null,
      phone: null,
      email: email.toLowerCase(),
      logo_url: null,
    };

    this.users.set(email.toLowerCase(), {
      user: newUser,
      password,
      business: newBusiness,
    });

    const session: DemoSession = {
      access_token: `demo_token_${Date.now()}`,
      user: newUser,
    };

    this.currentSession = session;

    return {
      data: { session, user: newUser },
      error: null
    };
  }

  async getSession(): Promise<{ data: { session: DemoSession | null }; error: any }> {
    return {
      data: { session: this.currentSession },
      error: null
    };
  }

  async signOut(): Promise<{ error: any }> {
    this.currentSession = null;
    return { error: null };
  }

  async refreshSession(): Promise<{ data: { session: DemoSession | null }; error: any }> {
    if (!this.currentSession) {
      return {
        data: { session: null },
        error: { message: 'No session to refresh' }
      };
    }

    // Generate new token
    this.currentSession.access_token = `demo_token_${Date.now()}`;

    return {
      data: { session: this.currentSession },
      error: null
    };
  }

  getUserProfile(userId: string): { data: DemoUser | null; error: any } {
    for (const userData of this.users.values()) {
      if (userData.user.id === userId) {
        return { data: userData.user, error: null };
      }
    }
    return { data: null, error: { message: 'User not found' } };
  }

  getBusinessForUser(userId: string): { data: DemoBusiness | null; error: any } {
    for (const userData of this.users.values()) {
      if (userData.user.id === userId) {
        return { data: userData.business, error: null };
      }
    }
    return { data: null, error: { message: 'Business not found' } };
  }

  getDemoCredentials(): Array<{ email: string; password: string; description: string }> {
    return [
      {
        email: 'demo@bizpilot.com',
        password: 'demo123',
        description: 'Demo user account'
      },
      {
        email: 'admin@bizpilot.com',
        password: 'admin123',
        description: 'Admin user account'
      }
    ];
  }
}

export const demoAuth = new DemoAuthService();
