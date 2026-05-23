import { 
  DataSource, 
  Repository, 
  EntityManager, 
  In 
} from 'typeorm';
import { 
  NotificationType, 
  Channel, 
  Region, 
  UserPreference as DomainUserPreference, 
  UserPreferences, 
  QuietHoursSettings,
  GlobalPolicy as DomainGlobalPolicy,
  DefaultPreferences as DomainDefaultPreferences,
  TimeInterval
} from '../domain/types';
import { 
  IUserPreferencesRepository,
  IGlobalPoliciesRepository,
  IDefaultPreferencesRepository
} from '../domain/repositories';
import { 
  UserPreferenceEntity, 
  UserQuietHoursEntity, 
  GlobalPolicyEntity, 
  DefaultPreferenceEntity 
} from '../domain/entities';

/**
 * Репозиторий для работы с предпочтениями пользователей (TypeORM реализация)
 */
export class UserPreferencesRepository implements IUserPreferencesRepository {
  private userPrefsRepo: Repository<UserPreferenceEntity>;
  private quietHoursRepo: Repository<UserQuietHoursEntity>;
  private defaultPrefsRepo: Repository<DefaultPreferenceEntity>;

  constructor(
    private dataSource: DataSource,
    private entityManager?: EntityManager
  ) {
    const manager = entityManager || dataSource.manager;
    this.userPrefsRepo = manager.getRepository(UserPreferenceEntity);
    this.quietHoursRepo = manager.getRepository(UserQuietHoursEntity);
    this.defaultPrefsRepo = manager.getRepository(DefaultPreferenceEntity);
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const [preferences, quietHours] = await Promise.all([
      this.userPrefsRepo.find({ where: { userId } }),
      this.quietHoursRepo.findOne({ where: { userId } })
    ]);

    if (preferences.length === 0 && !quietHours) {
      return null;
    }

    const domainPreferences: DomainUserPreference[] = preferences.map(p => ({
      notificationType: p.notificationType,
      channel: p.channel,
      enabled: p.enabled,
      updatedAt: p.updatedAt
    }));

    let domainQuietHours: QuietHoursSettings | undefined;
    if (quietHours) {
      domainQuietHours = {
        enabled: quietHours.enabled,
        timezone: quietHours.timezone,
        interval: {
          startHour: quietHours.startHour,
          endHour: quietHours.endHour
        },
        applyToNotificationTypes: quietHours.applyToNotificationTypes.map(
          t => t as NotificationType
        )
      };
    }

    const latestUpdate = preferences.reduce((latest, pref) => 
      pref.updatedAt > latest ? pref.updatedAt : latest, 
      new Date(0)
    );

    return {
      userId,
      preferences: domainPreferences,
      quietHours: domainQuietHours,
      createdAt: preferences[0]?.createdAt || new Date(),
      updatedAt: latestUpdate
    };
  }

  async upsertUserPreference(
    userId: string, 
    notificationType: NotificationType, 
    channel: Channel, 
    enabled: boolean
  ): Promise<DomainUserPreference> {
    const existing = await this.userPrefsRepo.findOne({
      where: { userId, notificationType, channel }
    });

    if (existing) {
      existing.enabled = enabled;
      existing.updatedAt = new Date();
      await this.userPrefsRepo.save(existing);
      
      return {
        notificationType: existing.notificationType,
        channel: existing.channel,
        enabled: existing.enabled,
        updatedAt: existing.updatedAt
      };
    } else {
      const newPref = this.userPrefsRepo.create({
        userId,
        notificationType,
        channel,
        enabled
      });
      
      await this.userPrefsRepo.save(newPref);
      
      return {
        notificationType: newPref.notificationType,
        channel: newPref.channel,
        enabled: newPref.enabled,
        updatedAt: newPref.updatedAt
      };
    }
  }

  async getUserPreference(
    userId: string, 
    notificationType: NotificationType, 
    channel: Channel
  ): Promise<DomainUserPreference | null> {
    const pref = await this.userPrefsRepo.findOne({
      where: { userId, notificationType, channel }
    });

    if (!pref) return null;

    return {
      notificationType: pref.notificationType,
      channel: pref.channel,
      enabled: pref.enabled,
      updatedAt: pref.updatedAt
    };
  }

  async setQuietHours(userId: string, settings: QuietHoursSettings): Promise<QuietHoursSettings> {
    const existing = await this.quietHoursRepo.findOne({ where: { userId } });

    if (existing) {
      existing.enabled = settings.enabled;
      existing.timezone = settings.timezone;
      existing.startHour = settings.interval.startHour;
      existing.endHour = settings.interval.endHour;
      existing.applyToNotificationTypes = settings.applyToNotificationTypes;
      existing.updatedAt = new Date();
      
      await this.quietHoursRepo.save(existing);
    } else {
      const newSettings = this.quietHoursRepo.create({
        userId,
        enabled: settings.enabled,
        timezone: settings.timezone,
        startHour: settings.interval.startHour,
        endHour: settings.interval.endHour,
        applyToNotificationTypes: settings.applyToNotificationTypes
      });
      
      await this.quietHoursRepo.save(newSettings);
    }

    return settings;
  }

  async getQuietHours(userId: string): Promise<QuietHoursSettings | null> {
    const settings = await this.quietHoursRepo.findOne({ where: { userId } });

    if (!settings) return null;

    return {
      enabled: settings.enabled,
      timezone: settings.timezone,
      interval: {
        startHour: settings.startHour,
        endHour: settings.endHour
      },
      applyToNotificationTypes: settings.applyToNotificationTypes.map(
        t => t as NotificationType
      )
    };
  }

  async createDefaultPreferences(userId: string): Promise<UserPreferences> {
    const defaultPrefs = await this.defaultPrefsRepo.find();
    const userPreferences: DomainUserPreference[] = [];
    const now = new Date();

    // Создаём предпочтения на основе дефолтных настроек
    for (const defaultPref of defaultPrefs) {
      const userPref = this.userPrefsRepo.create({
        userId,
        notificationType: defaultPref.notificationType,
        channel: defaultPref.channel,
        enabled: defaultPref.enabled
      });
      
      await this.userPrefsRepo.save(userPref);
      
      userPreferences.push({
        notificationType: userPref.notificationType,
        channel: userPref.channel,
        enabled: userPref.enabled,
        updatedAt: userPref.updatedAt
      });
    }

    return {
      userId,
      preferences: userPreferences,
      createdAt: now,
      updatedAt: now
    };
  }
}

/**
 * Репозиторий для работы с глобальными политиками (TypeORM реализация)
 */
export class GlobalPoliciesRepository implements IGlobalPoliciesRepository {
  private repo: Repository<GlobalPolicyEntity>;

  constructor(
    private dataSource: DataSource,
    private entityManager?: EntityManager
  ) {
    const manager = entityManager || dataSource.manager;
    this.repo = manager.getRepository(GlobalPolicyEntity);
  }

  async getAllPolicies(): Promise<DomainGlobalPolicy[]> {
    const policies = await this.repo.find({ order: { createdAt: 'DESC' } });
    
    return policies.map(p => ({
      id: p.id,
      notificationType: p.notificationType,
      channel: p.channel,
      region: p.region,
      enabled: p.enabled,
      description: p.description,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));
  }

  async getPolicy(
    notificationType: NotificationType, 
    channel: Channel | undefined, 
    region: Region
  ): Promise<DomainGlobalPolicy | null> {
    const where: any = { notificationType, region };
    
    if (channel !== undefined) {
      where.channel = channel;
    } else {
      where.channel = null;
    }
    
    const policy = await this.repo.findOne({ where });
    
    if (!policy) return null;

    return {
      id: policy.id,
      notificationType: policy.notificationType,
      channel: policy.channel,
      region: policy.region,
      enabled: policy.enabled,
      description: policy.description,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt
    };
  }

  async upsertPolicy(policy: Omit<DomainGlobalPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<DomainGlobalPolicy> {
    const where: any = { 
      notificationType: policy.notificationType, 
      region: policy.region 
    };
    
    if (policy.channel !== undefined) {
      where.channel = policy.channel;
    } else {
      where.channel = null;
    }
    
    const existing = await this.repo.findOne({ where });

    if (existing) {
      existing.enabled = policy.enabled;
      existing.description = policy.description;
      existing.updatedAt = new Date();
      
      await this.repo.save(existing);
      
      return {
        id: existing.id,
        notificationType: existing.notificationType,
        channel: existing.channel,
        region: existing.region,
        enabled: existing.enabled,
        description: existing.description,
        createdAt: existing.createdAt,
        updatedAt: existing.updatedAt
      };
    } else {
      const newPolicy = this.repo.create(policy);
      
      await this.repo.save(newPolicy);
      
      return {
        id: newPolicy.id,
        notificationType: newPolicy.notificationType,
        channel: newPolicy.channel,
        region: newPolicy.region,
        enabled: newPolicy.enabled,
        description: newPolicy.description,
        createdAt: newPolicy.createdAt,
        updatedAt: newPolicy.updatedAt
      };
    }
  }
}

/**
 * Репозиторий для работы с дефолтными настройками (TypeORM реализация)
 */
export class DefaultPreferencesRepository implements IDefaultPreferencesRepository {
  private repo: Repository<DefaultPreferenceEntity>;

  constructor(
    private dataSource: DataSource,
    private entityManager?: EntityManager
  ) {
    const manager = entityManager || dataSource.manager;
    this.repo = manager.getRepository(DefaultPreferenceEntity);
  }

  async getAllDefaults(): Promise<DomainDefaultPreferences[]> {
    const defaults = await this.repo.find();
    
    return defaults.map(d => ({
      notificationType: d.notificationType,
      channel: d.channel,
      enabled: d.enabled
    }));
  }

  async getDefault(
    notificationType: NotificationType, 
    channel: Channel
  ): Promise<DomainDefaultPreferences | null> {
    const defaultPref = await this.repo.findOne({
      where: { notificationType, channel }
    });

    if (!defaultPref) return null;

    return {
      notificationType: defaultPref.notificationType,
      channel: defaultPref.channel,
      enabled: defaultPref.enabled
    };
  }

  async upsertDefault(defaultPref: Omit<DomainDefaultPreferences, 'id' | 'createdAt' | 'updatedAt'>): Promise<DomainDefaultPreferences> {
    const existing = await this.repo.findOne({
      where: { 
        notificationType: defaultPref.notificationType, 
        channel: defaultPref.channel 
      }
    });

    if (existing) {
      existing.enabled = defaultPref.enabled;
      existing.updatedAt = new Date();
      
      await this.repo.save(existing);
    } else {
      const newDefault = this.repo.create(defaultPref);
      await this.repo.save(newDefault);
    }

    return defaultPref;
  }
}