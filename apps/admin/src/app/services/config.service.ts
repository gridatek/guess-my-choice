import { Injectable } from '@angular/core';

export interface AppConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private config: AppConfig | null = null;

  async loadConfig(): Promise<AppConfig> {
    if (this.config) {
      return this.config;
    }

    const response = await fetch('/config.json');
    if (!response.ok) {
      throw new Error('Failed to load configuration');
    }

    this.config = await response.json();
    return this.config!;
  }

  getConfig(): AppConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config;
  }
}
