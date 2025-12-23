// Define EventType locally to avoid import issues
export enum EventType {
  PAGE_VIEW = 'page_view',
  USER_CLICK = 'user_click',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  PURCHASE = 'purchase',
  ADD_TO_CART = 'add_to_cart',
  REMOVE_FROM_CART = 'remove_from_cart',
  SEARCH = 'search',
  SIGNUP = 'signup',
  CUSTOM = 'custom'
}

export class CreateAnalyticsEventDto {
  eventType!: EventType;
  userId!: string;
  sessionId?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  device?: {
    type?: 'desktop' | 'mobile' | 'tablet';
    os?: string;
    browser?: string;
    version?: string;
    screenResolution?: string;
  };
  attribution?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  tags?: string[];
  country?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  source?: string;
  businessValue?: number;
  isRealtime?: boolean;
}