export enum AiAction {
  GET_MY_CART = 'GET_MY_CART',
  GET_MY_ORDERS = 'GET_MY_ORDERS',
  GET_ORDER_STATS = 'GET_ORDER_STATS',
  SEARCH_PRODUCTS = 'SEARCH_PRODUCTS',
  TRACK_ORDER = 'TRACK_ORDER',
  GET_CATEGORIES = 'GET_CATEGORIES',
  FILTER_BY_CATEGORY = 'FILTER_BY_CATEGORY',
  GENERAL_CHAT = 'GENERAL_CHAT',
  UNKNOWN = 'UNKNOWN',
}

export interface AiIntentParams {
  q?: string;
  orderNumber?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
}

export interface AiIntentResult {
  action: AiAction;
  params?: AiIntentParams;
  confidence: number;
  needsMoreInfo: boolean;
  missingParams?: string[];
}
