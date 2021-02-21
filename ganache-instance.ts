import querystring from "querystring";
import ganache from "ganache-core";
import fetch from "node-fetch";

const ETHEREUM_ENDPOINT = process.env.ETHEREUM_ENDPOINT;
if (!ETHEREUM_ENDPOINT) {
    throw new Error("The ETHEREUM_ENDPOINT env-var must be set");
}

export interface IGanacheInstanceConfig {
    port: number
    providerOptions,
}

export class GanacheInstance {
    private server: ReturnType<typeof ganache.server>;

    constructor(public readonly id: number,
                public readonly config: IGanacheInstanceConfig) {}

    async run() {
        this.server = ganache.server({
            ...this.config.providerOptions,
            port: this.config.port,
            fork: ETHEREUM_ENDPOINT
        });
        await new Promise<void>((resolve, reject) => this.server.listen(this.config.port, (err => {
            if (err) {
                reject(err)
            } else {
                resolve();
            }
        }) as any));

        console.log(`CREATED ganache instance at port ${this.config.port}, id: ${this.id}`);
    }

    async destroy() {
        await new Promise<void>((resolve, reject) => this.server.close(err => err ? reject(err) : resolve()));
        console.log(`DESTROYED ganache instance at port ${this.config.port}, id: ${this.id}`);
    }

    endpoint(): string {
        return `http://127.0.0.1:${this.config.port}`;
    }

    async request(method: string, path: string, query: object, body: object): Promise<{statusCode: number, body: string}> {
        method = method.toLowerCase();
        const response = await fetch(this.endpoint() + querystring.encode((query as any) || {}), {
            method,
            body: (method == "get" || method == "head") ? undefined : JSON.stringify(body || {}),
            headers: {'Content-Type': 'application/json'}
        });
        return {
            statusCode: response.status,
            body: await response.text()
        }
    }
}