/** In-memory AsyncStorage stand-in for node tests. */
const store = new Map();

const AsyncStorage = {
  async getItem(key) {
    return store.has(key) ? store.get(key) : null;
  },
  async setItem(key, value) {
    store.set(key, String(value));
  },
  async removeItem(key) {
    store.delete(key);
  },
  async getAllKeys() {
    return [...store.keys()];
  },
  async multiGet(keys) {
    return keys.map((key) => [key, store.has(key) ? store.get(key) : null]);
  },
  async multiRemove(keys) {
    for (const key of keys) store.delete(key);
  },
  async clear() {
    store.clear();
  },
};

export default AsyncStorage;
