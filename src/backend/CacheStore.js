/**
 * For all your caching purposes
 */

const fs = require('fs');

class CacheStore {
    /**
     * Cache constructor
     * @param {string} path
     */
    constructor(_path) {
      this.path = _path;
      this.cache = {};
      this.readFromFile();
    }

    /**
     * Sets a cache item
     *
     * @param {string} key
     * @param {any} value
     */
    async set(key, value) {
        this.cache[key] = value;
        return fs.writeFile(this.path, JSON.stringify(this.cache), function(error) {
          // TODO
        });
    }

    /**
     * Sets multiple cache items
     * @param {}[] keys
     */
    setMultiple(keys) {
        let keysToSet = {};
        keys.forEach(key => {
            let keyToSet = Object.entries(key);
            keysToSet[keyToSet[0][0]] = keyToSet[0][1];
        });
        Object.assign(this.cache, keysToSet);
        fs.writeFile(this.path, JSON.stringify(this.cache));
    }

    /**
     * Gets a key / value pair, sets the key if setDefault == true
     * @param {string} key The value we are searching for
     * @param {any} defaultValue If the key doesn't exist we can create the key
     * @param {boolean} setDefault Should we create a new key if it doesn't exist?
     * @returns {any} returns null if undefined
     */
    get(key, defaultValue = null, setDefault = false) {
        let val = this.cache[key];

        if (val == undefined) {
            if (setDefault) this.set(key, defaultValue);
            return defaultValue;
        }

        return val;
    }

  async readFromFile() {
      //this.cache = JSON.parse(await fs.readFile(this.path)); // Reads the cache file
      await fs.readFile(this.path, (err, data) => {
        if (err) {
          // TODO create file??
          console.error(err);
          this.cache = {};
          return;
        }
        this.cache = JSON.parse(data);
        console.log('cache file content: ');
        console.log(this.cache);
      });
  }

 }

module.exports = {
  CacheStore,
};
