import {GanacheInstance, IGanacheInstanceConfig} from "./ganache-instance";

export interface IGanachePoolConfig {
    MaxInstances: number,
    MaxAge: number,
    KeepaliveTimeout: number,
}

const DefaultConfig: IGanachePoolConfig = {
    MaxInstances: 2,
    MaxAge: 60_000,
    KeepaliveTimeout: 5_000
}

const PORT_BASE = 4000;
const PORT_RANGE = 1000;

export class GanachePool {

    private instances: {[id: number]: {
        instance: GanacheInstance,
        createdAt: Date,
        retrievedAt: Date
    }} = {};
    private portToInstance: {[port: number]: GanacheInstance} = {};
    private lastPortAllocation = 0;

    constructor(public readonly config = DefaultConfig) {}

    async create(providerOptions): Promise<GanacheInstance> {
        await this.clear();

        if (Object.keys(this.instances).length >= this.config.MaxInstances) {
            throw new Error("Too many instances, try again later");
        }

        const PORT_BASE = 4000;
        let port = null;
        for (let i = (this.lastPortAllocation + 1) % PORT_RANGE; i != this.lastPortAllocation; i = (i + 1) % PORT_BASE) {
            const _port = PORT_BASE + this.lastPortAllocation;
            if (this.portToInstance[port] == null) {
                port = _port;
                this.lastPortAllocation = i;
                break;
            }
        }

        if (!port) {
            throw new Error("No free port in range");
        }

        let id;
        do {
            id = Math.floor(Math.random() * 1000000);
        } while (this.instances[id] != null);

        const instance = new GanacheInstance(id,{port, providerOptions});
        this.instances[id] = {
            instance,
            createdAt: new Date(),
            retrievedAt: new Date()
        };
        this.portToInstance[port] = instance;

        try {
            await instance.run();
        } catch (e) {
            await this.destroy(instance);
            throw new Error(`Unable to run new instance at port ${instance.config.port}, reason: ${e.toString()}`);
        }
        return instance;
    }

    async destroy(instance: GanacheInstance) {
        if (!this.instances[instance.id]) return;

        try {
            await instance.destroy();
        } catch (e) {
            console.log(`WARNING: Unable to destroy instance ${instance.id} at port ${instance.config.port}`);
            console.error(e);
        }
        delete this.instances[instance.id];
        delete this.portToInstance[instance.config.port];
    }

    async get(id: number): Promise<GanacheInstance> {
        await this.clear();

        const instance = this.instances[id];
        if (!instance) {
            throw new Error(`No such instance with id: ${id}`);
        }
        instance.retrievedAt = new Date();
        return instance.instance;
    }

    async clear(): Promise<void> {
        for (const id in this.instances) {
            const instance = this.instances[id];
            if (
                instance.retrievedAt.getTime() + this.config.KeepaliveTimeout < Date.now() ||
                instance.createdAt.getTime() + this.config.MaxAge < Date.now()
            ) {
                await this.destroy(instance.instance);
            }
        }
    }
}