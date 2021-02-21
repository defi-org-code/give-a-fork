import fetch from "node-fetch";
import Web3 from "web3";

const {lpPositionStatus} = require("./balancer-test");

require("./server");

async function createInstance(): Promise<number> {
    const createRes = await fetch("http://127.0.0.1:3000/create", {
        method: "post",
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
    });
    if (createRes.status != 200) {
        throw new Error(await createRes.text());
    }

    const id = (await createRes.json()).id;
    console.log(`Created instance: ${id}`);
    return id;
}

async function destroyInstance(id) {
    await fetch("http://127.0.0.1:3000/destroy", {
        method: "post",
        body: JSON.stringify({id}),
        headers: {'Content-Type': 'application/json'},
    });
}

async function testOneInstance() {
    const id = await createInstance();
    const ENDPOINT = "http://127.0.0.1:3000/instances/" + id;

    const web3 = new Web3(new Web3.providers.HttpProvider(ENDPOINT));
    console.log(`Block number: ${await web3.eth.getBlockNumber()}`)

    await destroyInstance(id);
}

async function testTwoInstances() {
    const id1 = await createInstance();
    const ENDPOINT1 = "http://127.0.0.1:3000/instances/" + id1;

    const id2 = await createInstance();
    const ENDPOINT2 = "http://127.0.0.1:3000/instances/" + id2;

    const web3_1 = new Web3(new Web3.providers.HttpProvider(ENDPOINT1));
    console.log(`Block number: ${await web3_1.eth.getBlockNumber()}`);

    const web3_2 = new Web3(new Web3.providers.HttpProvider(ENDPOINT2));
    console.log(`Block number: ${await web3_2.eth.getBlockNumber()}`);

    await destroyInstance(id1);
    await destroyInstance(id2);
}

async function testThreeInstances() {
    const id1 = await createInstance();
    const ENDPOINT1 = "http://127.0.0.1:3000/instances/" + id1;

    const id2 = await createInstance();
    const ENDPOINT2 = "http://127.0.0.1:3000/instances/" + id2;

    const web3_1 = new Web3(new Web3.providers.HttpProvider(ENDPOINT1));
    console.log(`Block number: ${await web3_1.eth.getBlockNumber()}`)

    const web3_2 = new Web3(new Web3.providers.HttpProvider(ENDPOINT2));
    console.log(`Block number: ${await web3_2.eth.getBlockNumber()}`)

    await new Promise(resolve => setTimeout(resolve, 5000));

    const id3 = await createInstance();
    const ENDPOINT3 = "http://127.0.0.1:3000/instances/" + id3;

    const web3_3 = new Web3(new Web3.providers.HttpProvider(ENDPOINT3));
    console.log(`Block number: ${await web3_3.eth.getBlockNumber()}`)
}

async function testRepeatedGet() {
    const id = await createInstance();
    const ENDPOINT = "http://127.0.0.1:3000/instances/" + id;

    const web3 = new Web3(new Web3.providers.HttpProvider(ENDPOINT));

    for (let i = 0; i < 10; i++) {
        console.log(`Block number: ${await web3.eth.getBlockNumber()}`)
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
}

async function testBalancer() {
    const id = await createInstance();
    const ENDPOINT = "http://127.0.0.1:3000/instances/" + id;

    const web3 = new Web3(new Web3.providers.HttpProvider(ENDPOINT));

    const ACCOUNT = "0x49a2dcc237a65cc1f412ed47e0594602f6141936";
    const POOL = "0x1eff8af5d577060ba4ac8a29a13525bb0ee2a3d5";

    console.log(await lpPositionStatus(ACCOUNT, POOL, web3));
}

async function test() {
    // await testOneInstance();
    // await testTwoInstances();
    // await testThreeInstances();
    // await testRepeatedGet();
    await testBalancer();
}

test().then(
    () => console.log("Done"),
    e => console.error(e)
).finally(() => {
    process.exit(0);
})
