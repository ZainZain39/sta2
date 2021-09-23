class DbConfig {
	setStore(store) {
		const path = location.pathname.replace(/\\/g, "/").replace(/\/[^/]*$/, "/");
		this.dbName = `${store} with ${path}`;
		this.storeName = store;
		return this;
	}
	setKey(key) {
		this.keyName = key;
		return this;
	}
	setInit(initData) {
		this.initData = initData;
		return this;
	}
}

class DbMap extends Map {
	constructor(entries) {
		super(entries);
	}
	async setDbConfig(dbconfig) {
		if(!dbconfig?.storeName) throw new Error("DbMap.setDbConfig");
		this.dbconfig = dbconfig;
		this.db = await this.#open();
		this.canUseDB = true;
		await this.#Sync();
		return this;
	}
	async #Sync() {
		const keyList = await this.#getAllKeys();
		for(const key of keyList) {
			const value = await this.#get(key);
			super.set(key, value);
		}
		for(const [k, v] of super.entries()) {
			await this.#put(k, v);
		}
	}
	get(key) {
		return super.get(key) ?? (this.dbconfig?.initData ? {...this.dbconfig.initData} : undefined);
	}
	async set(key, value) {
		if(this.canUseDB) await this.#put(key, value);
		return super.set(key, value);
	}
	async delete(key) {
		if(this.canUseDB) await this.#delete(key);
		return super.delete(key);
	}
	async clear() {
		if(this.canUseDB) await this.#clear();
		super.clear();
	}
	#open() {
		return new Promise((resolve, reject) => {
			const req = indexedDB.open(this.dbconfig.dbName);
			const options = this.dbconfig.keyName
				? { keyPath: this.dbconfig.keyName, autoIncrement: true }
				: { autoIncrement: false };
			req.onupgradeneeded = e => e.target.result.createObjectStore(this.dbconfig.storeName, options);
			req.onsuccess = e => resolve(e.target.result);
			req.onerror = e => reject(new Error("DbMap.#open"));
		});
	}
	#getObjectStore(mode) {
		const tran = this.db.transaction(this.dbconfig.storeName, mode);
		return tran.objectStore(this.dbconfig.storeName);
	}
	#getAllKeys() {
		return new Promise((resolve, reject) => {
			const store = this.#getObjectStore("readonly");
			const req = store.getAllKeys();
			req.onsuccess = e => resolve(e.target.result);
			req.onerror = e => reject(new Error("DbMap.#getAllKeys"));
		});
	}
	#get(key) {
		return new Promise((resolve, reject) => {
			const store = this.#getObjectStore("readonly");
			const req = store.get(key);
			req.onsuccess = e => resolve(e.target.result);
			req.onerror = e => reject(new Error("DbMap.#get"));
		});
	}
	#put(key, value) {
		if(this.dbconfig.keyName) value[this.dbconfig.keyName] = key;
		return new Promise((resolve, reject) => {
			const store = this.#getObjectStore("readwrite");
			const req = this.dbconfig.keyName
				? store.put(value)
				: store.put(value, key);
			req.onsuccess = e => resolve();
			req.onerror = e => reject(new Error("DbMap.#put"));
		});
	}
	#delete(key) {
		return new Promise((resolve, reject) => {
			const store = this.#getObjectStore("readwrite");
			const req = store.delete(key);
			req.onsuccess = e => resolve();
			req.onerror = e => reject(new Error("DbMap.#delete"));
		});
	}
	#clear() {
		return new Promise((resolve, reject) => {
			const store = this.#getObjectStore("readwrite");
			const req = store.clear();
			req.onsuccess = e => resolve();
			req.onerror = e => reject(new Error("DbMap.#clear"));
		});
	}
}

/*	how to use
	const init_data1 = [
		["A", 100],
		["B", 200],
		["C", 300],
	];
	const dbconfig1 = new DbConfig().setStore("para");
	const dbmap1 = await new DbMap(init_data1).setDbConfig(dbconfig1);
	console.log(dbmap1.entries());
	console.log(dbmap1.set("A", 110));
	console.log(dbmap1.delete("B"));
	console.log(dbmap1.set("D", 400));

	const init_data2 = [
		["A", { value: 100 }],
		["B", { value: 200 }],
		["C", { value: 300 }],
	];
	const dbconfig2 = new DbConfig().setStore("data");
	const dbmap2 = await new DbMap(init_data2).setDbConfig(dbconfig2);
	console.log(dbmap2.entries());
	console.log(dbmap2.set("A", { value: 110 }));
	console.log(dbmap2.delete("B"));
	console.log(dbmap2.set("D", { value: 400 }));
*/
