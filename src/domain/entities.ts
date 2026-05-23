import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  Index,
  Unique
} from 'typeorm';
import { NotificationType, Channel, Region } from './types';

/**
 * Сущность для хранения предпочтений пользователя
 */
@Entity('user_preferences')
@Unique(['userId', 'notificationType', 'channel'])
export class UserPreferenceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  userId!: string;

  @Column({
    type: 'enum',
    enum: NotificationType
  })
  notificationType!: NotificationType;

  @Column({
    type: 'enum',
    enum: Channel
  })
  channel!: Channel;

  @Column({ default: true })
  enabled!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

/**
 * Сущность для хранения настроек quiet hours пользователя
 */
@Entity('user_quiet_hours')
export class UserQuietHoursEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index({ unique: true })
  userId!: string;

  @Column({ default: false })
  enabled!: boolean;

  @Column()
  timezone!: string; // IANA timezone

  @Column()
  startHour!: number; // 0-23

  @Column()
  endHour!: number; // 0-23

  @Column('simple-array')
  applyToNotificationTypes!: string[]; // JSON массив NotificationType

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

/**
 * Сущность для хранения глобальных политик
 */
@Entity('global_policies')
@Unique(['notificationType', 'channel', 'region'])
export class GlobalPolicyEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: NotificationType
  })
  notificationType!: NotificationType;

  @Column({
    type: 'enum',
    enum: Channel,
    nullable: true
  })
  channel?: Channel;

  @Column({
    type: 'enum',
    enum: Region
  })
  region!: Region;

  @Column({ default: true })
  enabled!: boolean; // false = запрещено

  @Column()
  description!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

/**
 * Сущность для хранения дефолтных настроек
 */
@Entity('default_preferences')
@Unique(['notificationType', 'channel'])
export class DefaultPreferenceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: NotificationType
  })
  notificationType!: NotificationType;

  @Column({
    type: 'enum',
    enum: Channel
  })
  channel!: Channel;

  @Column({ default: true })
  enabled!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}