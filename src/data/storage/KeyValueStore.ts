import AsyncStorage from '@react-native-async-storage/async-storage';

export interface KeyValueStore {
  read<T>(key: string): Promise<T | null>;
  write<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}

export class AsyncStorageStore implements KeyValueStore {
  constructor(private readonly namespace = '8star') {}

  private key(k: string) {
    return `${this.namespace}:${k}`;
  }

  async read<T>(key: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(this.key(key));
    if (raw == null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async write<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(this.key(key), JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(this.key(key));
  }
}
