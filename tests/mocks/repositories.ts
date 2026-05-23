import { 
  NotificationType, 
  Channel, 
  Region, 
  UserPreference, 
  UserPreferences, 
  QuietHoursSettings,
  GlobalPolicy,
  DefaultPreferences,
  NotificationEvaluationRequest,
  NotificationEvaluationResult
} from '../../src/domain/types';
import { 
  IUserPreferencesRepository,
  IGlobalPoliciesRepository,
  IDefaultPreferencesRepository
} from '../../src/domain/repositories';

/**
 * Mock репозиторий для тестирования
 */
export class MockUserPreferencesRepository implements IUserPreferencesRepository {
  private preferences: Map<string, UserPreference[]> = new Map();
  private quietHours: Map<string, QuietHoursSettings> = new Map();
  private defaultPrefs: DefaultPreferences[] = [];

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const userPrefs = this.preferences.get(userId) || [];
    const userQuietHours = this.quietHours.get(userId);
    
    if (userPrefs.length === 0 && !userQuietHours) {
      return null;
    }

    return {
      userId,
      preferences: userPrefs,
      quietHours: userQuietHours,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async upsertUserPreference(
    userId: string, 
    notificationType: NotificationType, 
    channel: Channel, 
    enabled: boolean
  ): Promise<UserPreference> {
    let userPrefs = this.preferences.get(userId) || [];
    
    // Удаляем существующее предпочтение если есть
    userPrefs = userPrefs.filter(p => 
      !(p.notificationType === notificationType && p.channel === channel)
    );
    
    const newPref: UserPreference = {
      notificationType,
      channel,
      enabled,
      updatedAt: new Date()
    };
    
    userPrefs.push(newPref);
    this.preferences.set(userId, userPrefs);
    
    return newPref;
  }

  async getUserPreference(
    userId: string, 
    notificationType: NotificationType, 
    channel: Channel
  ): Promise<UserPreference | null> {
    const userPrefs = this.preferences.get(userId) || [];
    return userPrefs.find(p => 
      p.notificationType === notificationType && p.channel === channel
    ) || null;
  }

  async setQuietHours(userId: string, settings: QuietHoursSettings): Promise<QuietHoursSettings> {
    this.quietHours.set(userId, settings);
    return settings;
  }

  async getQuietHours(userId: string): Promise<QuietHoursSettings | null> {
    return this.quietHours.get(userId) || null;
  }

  async createDefaultPreferences(userId: string): Promise<UserPreferences> {
    const userPrefs: UserPreference[] = this.defaultPrefs.map(dp => ({
      notificationType: dp.notificationType,
      channel: dp.channel,
      enabled: dp.enabled,
      updatedAt: new Date()
    }));
    
    this.preferences.set(userId, userPrefs);
    
    return {
      userId,
      preferences: userPrefs,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  setDefaultPreferences(defaults: DefaultPreferences[]): void {
    this.defaultPrefs = defaults;
  }

  clear(): void {
    this.preferences.clear();
    this.quietHours.clear();
  }
}

/**
 * Mock репозиторий для глобальных политик
 */
export class MockGlobalPoliciesRepository implements IGlobalPoliciesRepository {
  private policies: GlobalPolicy[] = [];

  async getAllPolicies(): Promise<GlobalPolicy[]> {
    return [...this.policies];
  }

  async getPolicy(
    notificationType: NotificationType, 
    channel: Channel | undefined, 
    region: Region
  ): Promise<GlobalPolicy | null> {
    return this.policies.find(p => 
      p.notificationType === notificationType && 
      p.channel === channel && 
      p.region === region
    ) || null;
  }

  async upsertPolicy(policy: Omit<GlobalPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<GlobalPolicy> {
    const existingIndex = this.policies.findIndex(p => 
      p.notificationType === policy.notificationType && 
      p.channel === policy.channel && 
      p.region === policy.region
    );
    
    const newPolicy: GlobalPolicy = {
      ...policy,
      id: `mock-${Date.now()}-${Math.random()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    if (existingIndex >= 0) {
      this.policies[existingIndex] = newPolicy;
    } else {
      this.policies.push(newPolicy);
    }
    
    return newPolicy;
  }

  setPolicies(policies: GlobalPolicy[]): void {
    this.policies = policies;
  }

  clear(): void {
    this.policies = [];
  }
}

/**
 * Mock репозиторий для дефолтных настроек
 */
export class MockDefaultPreferencesRepository implements IDefaultPreferencesRepository {
  private defaults: DefaultPreferences[] = [];

  async getAllDefaults(): Promise<DefaultPreferences[]> {
    return [...this.defaults];
  }

  async getDefault(
    notificationType: NotificationType, 
    channel: Channel
  ): Promise<DefaultPreferences | null> {
    return this.defaults.find(d => 
      d.notificationType === notificationType && d.channel === channel
    ) || null;
  }

  async upsertDefault(defaultPref: Omit<DefaultPreferences, 'id' | 'createdAt' | 'updatedAt'>): Promise<DefaultPreferences> {
    const existingIndex = this.defaults.findIndex(d => 
      d.notificationType === defaultPref.notificationType && 
      d.channel === defaultPref.channel
    );
    
    if (existingIndex >= 0) {
      this.defaults[existingIndex] = defaultPref;
    } else {
      this.defaults.push(defaultPref);
    }
    
    return defaultPref;
  }

  setDefaults(defaults: DefaultPreferences[]): void {
    this.defaults = defaults;
  }

  clear(): void {
    this.defaults = [];
  }
}