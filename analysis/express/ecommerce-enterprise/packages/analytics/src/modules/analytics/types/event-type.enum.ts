/**
 * Comprehensive analytics event types for enterprise-grade tracking
 * Organized by business domains and user interaction patterns
 */
export enum EventType {
  // ============================================================================
  // USER ENGAGEMENT EVENTS
  // ============================================================================

  /** User clicked on an element */
  USER_CLICK = 'user_click',

  /** User viewed a page */
  PAGE_VIEW = 'page_view',

  /** User scrolled on a page */
  SCROLL = 'scroll',

  /** User hovered over an element */
  HOVER = 'hover',

  /** User focused on an input field */
  FOCUS = 'focus',

  /** User submitted a form */
  FORM_SUBMIT = 'form_submit',

  /** User interacted with a widget/component */
  WIDGET_INTERACTION = 'widget_interaction',

  // ============================================================================
  // COMMERCE EVENTS
  // ============================================================================

  /** User added item to cart */
  ADD_TO_CART = 'add_to_cart',

  /** User removed item from cart */
  REMOVE_FROM_CART = 'remove_from_cart',

  /** User initiated checkout process */
  CHECKOUT_START = 'checkout_start',

  /** User completed purchase */
  PURCHASE = 'purchase',

  /** User abandoned cart */
  CART_ABANDONMENT = 'cart_abandonment',

  /** User viewed product details */
  PRODUCT_VIEW = 'product_view',

  /** User applied discount/coupon */
  DISCOUNT_APPLIED = 'discount_applied',

  /** User initiated return/refund */
  RETURN_INITIATED = 'return_initiated',

  // ============================================================================
  // DISCOVERY & SEARCH EVENTS
  // ============================================================================

  /** User performed a search */
  SEARCH = 'search',

  /** User applied filters */
  FILTER_APPLIED = 'filter_applied',

  /** User sorted results */
  SORT_APPLIED = 'sort_applied',

  /** User viewed search results */
  SEARCH_RESULTS_VIEW = 'search_results_view',

  /** User clicked on search result */
  SEARCH_RESULT_CLICK = 'search_result_click',

  /** No search results found */
  SEARCH_NO_RESULTS = 'search_no_results',

  // ============================================================================
  // AUTHENTICATION & USER MANAGEMENT
  // ============================================================================

  /** User logged in */
  LOGIN = 'login',

  /** User logged out */
  LOGOUT = 'logout',

  /** User signed up */
  SIGNUP = 'signup',

  /** User password reset requested */
  PASSWORD_RESET_REQUEST = 'password_reset_request',

  /** User password reset completed */
  PASSWORD_RESET_COMPLETE = 'password_reset_complete',

  /** User profile updated */
  PROFILE_UPDATE = 'profile_update',

  /** User account deleted */
  ACCOUNT_DELETION = 'account_deletion',

  // ============================================================================
  // CONTENT & MEDIA EVENTS
  // ============================================================================

  /** User started watching video */
  VIDEO_START = 'video_start',

  /** User paused video */
  VIDEO_PAUSE = 'video_pause',

  /** User completed watching video */
  VIDEO_COMPLETE = 'video_complete',

  /** User downloaded content */
  CONTENT_DOWNLOAD = 'content_download',

  /** User shared content */
  CONTENT_SHARE = 'content_share',

  /** User bookmarked content */
  CONTENT_BOOKMARK = 'content_bookmark',

  /** User rated/reviewed content */
  CONTENT_RATING = 'content_rating',

  // ============================================================================
  // SOCIAL & COMMUNITY EVENTS
  // ============================================================================

  /** User followed another user */
  USER_FOLLOW = 'user_follow',

  /** User unfollowed another user */
  USER_UNFOLLOW = 'user_unfollow',

  /** User liked content */
  CONTENT_LIKE = 'content_like',

  /** User commented on content */
  CONTENT_COMMENT = 'content_comment',

  /** User shared content on social media */
  SOCIAL_SHARE = 'social_share',

  /** User joined community/group */
  COMMUNITY_JOIN = 'community_join',

  // ============================================================================
  // TECHNICAL & PERFORMANCE EVENTS
  // ============================================================================

  /** Application error occurred */
  ERROR = 'error',

  /** API request timed out */
  TIMEOUT = 'timeout',

  /** Performance metric recorded */
  PERFORMANCE_METRIC = 'performance_metric',

  /** JavaScript error occurred */
  JAVASCRIPT_ERROR = 'javascript_error',

  /** Network request failed */
  NETWORK_ERROR = 'network_error',

  /** User experienced slow loading */
  SLOW_LOADING = 'slow_loading',

  // ============================================================================
  // BUSINESS & ANALYTICS EVENTS
  // ============================================================================

  /** Custom business event */
  BUSINESS_EVENT = 'business_event',

  /** A/B test variant viewed */
  AB_TEST_VIEW = 'ab_test_view',

  /** Marketing campaign interaction */
  CAMPAIGN_INTERACTION = 'campaign_interaction',

  /** Feature usage tracking */
  FEATURE_USAGE = 'feature_usage',

  /** Goal completion */
  GOAL_COMPLETED = 'goal_completed',

  /** Funnel step reached */
  FUNNEL_STEP = 'funnel_step',

  // ============================================================================
  // MOBILE & DEVICE SPECIFIC EVENTS
  // ============================================================================

  /** App opened */
  APP_OPEN = 'app_open',

  /** App closed */
  APP_CLOSE = 'app_close',

  /** Push notification received */
  PUSH_NOTIFICATION_RECEIVED = 'push_notification_received',

  /** Push notification opened */
  PUSH_NOTIFICATION_OPENED = 'push_notification_opened',

  /** In-app purchase initiated */
  IN_APP_PURCHASE = 'in_app_purchase',

  /** Device orientation changed */
  ORIENTATION_CHANGE = 'orientation_change',
}

/**
 * Event type categories for grouping and analysis
 */
export const EVENT_CATEGORIES = {
  ENGAGEMENT: [
    EventType.USER_CLICK,
    EventType.PAGE_VIEW,
    EventType.SCROLL,
    EventType.HOVER,
    EventType.FOCUS,
    EventType.WIDGET_INTERACTION,
  ],

  COMMERCE: [
    EventType.ADD_TO_CART,
    EventType.REMOVE_FROM_CART,
    EventType.CHECKOUT_START,
    EventType.PURCHASE,
    EventType.CART_ABANDONMENT,
    EventType.PRODUCT_VIEW,
    EventType.DISCOUNT_APPLIED,
    EventType.RETURN_INITIATED,
  ],

  DISCOVERY: [
    EventType.SEARCH,
    EventType.FILTER_APPLIED,
    EventType.SORT_APPLIED,
    EventType.SEARCH_RESULTS_VIEW,
    EventType.SEARCH_RESULT_CLICK,
    EventType.SEARCH_NO_RESULTS,
  ],

  AUTHENTICATION: [
    EventType.LOGIN,
    EventType.LOGOUT,
    EventType.SIGNUP,
    EventType.PASSWORD_RESET_REQUEST,
    EventType.PASSWORD_RESET_COMPLETE,
    EventType.PROFILE_UPDATE,
    EventType.ACCOUNT_DELETION,
  ],

  CONTENT: [
    EventType.VIDEO_START,
    EventType.VIDEO_PAUSE,
    EventType.VIDEO_COMPLETE,
    EventType.CONTENT_DOWNLOAD,
    EventType.CONTENT_SHARE,
    EventType.CONTENT_BOOKMARK,
    EventType.CONTENT_RATING,
  ],

  SOCIAL: [
    EventType.USER_FOLLOW,
    EventType.USER_UNFOLLOW,
    EventType.CONTENT_LIKE,
    EventType.CONTENT_COMMENT,
    EventType.SOCIAL_SHARE,
    EventType.COMMUNITY_JOIN,
  ],

  TECHNICAL: [
    EventType.ERROR,
    EventType.TIMEOUT,
    EventType.PERFORMANCE_METRIC,
    EventType.JAVASCRIPT_ERROR,
    EventType.NETWORK_ERROR,
    EventType.SLOW_LOADING,
  ],

  BUSINESS: [
    EventType.BUSINESS_EVENT,
    EventType.AB_TEST_VIEW,
    EventType.CAMPAIGN_INTERACTION,
    EventType.FEATURE_USAGE,
    EventType.GOAL_COMPLETED,
    EventType.FUNNEL_STEP,
  ],

  MOBILE: [
    EventType.APP_OPEN,
    EventType.APP_CLOSE,
    EventType.PUSH_NOTIFICATION_RECEIVED,
    EventType.PUSH_NOTIFICATION_OPENED,
    EventType.IN_APP_PURCHASE,
    EventType.ORIENTATION_CHANGE,
  ],
} as const;

/**
 * Get the category of an event type
 */
export function getEventCategory(eventType: EventType): string {
  for (const [category, events] of Object.entries(EVENT_CATEGORIES)) {
    if ((events as EventType[]).includes(eventType)) {
      return category;
    }
  }
  return 'UNKNOWN';
}

/**
 * Check if an event type belongs to a specific category
 */
export function isEventInCategory(eventType: EventType, category: keyof typeof EVENT_CATEGORIES): boolean {
  return (EVENT_CATEGORIES[category] as EventType[]).includes(eventType);
}

/**
 * Get all event types in a category
 */
export function getEventsInCategory(category: keyof typeof EVENT_CATEGORIES): EventType[] {
  return EVENT_CATEGORIES[category] as unknown as EventType[];
}

/**
 * Get business value multiplier for event type
 */
export function getEventValueMultiplier(eventType: EventType): number {
  switch (eventType) {
    case EventType.PURCHASE:
      return 10.0; // Highest value

    case EventType.ADD_TO_CART:
    case EventType.CHECKOUT_START:
      return 3.0; // High intent

    case EventType.PRODUCT_VIEW:
    case EventType.SEARCH:
      return 1.0; // Medium intent

    case EventType.USER_CLICK:
    case EventType.PAGE_VIEW:
      return 0.1; // Low intent

    default:
      return 0.5; // Default value
  }
}
