import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type SupabaseClientFactory = (url: string, key: string) => SupabaseClient;

export interface SupabaseClientOptions {
  url: string;
  key: string;
  createClient?: SupabaseClientFactory;
}

export class SupabaseClientSingleton {
  private static instance: SupabaseClient | null = null;

  private constructor() {}

  static getInstance(options: SupabaseClientOptions): SupabaseClient {
    if (!SupabaseClientSingleton.instance) {
      const factory = options.createClient || createClient;
      SupabaseClientSingleton.instance = factory(options.url, options.key);
    }

    return SupabaseClientSingleton.instance;
  }

  static resetForTests(): void {
    if (process.env.NODE_ENV === 'test') {
      SupabaseClientSingleton.instance = null;
    }
  }
}