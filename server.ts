import express from "express";
import {GanachePool} from "./ganache-pool";

const ganachePool = new GanachePool();

const app = express();
const port = 3000;

app.use(express.json());

app.use("/instances/:id", async (req, res) => {
    try {
        const instance = await ganachePool.get(req.params.id);
        const {statusCode, body} = await instance.request(req.method, req.path, req.query, req.body);
        res.status(statusCode).end(body);
    } catch (e) {
        res.status(500).json({"error": e.toString()});
    }
})

app.post("/create", async (req, res) => {
    try {
        const instance = await ganachePool.create(req.body.providerOptions);
        res.json({
            id: instance.id
        })
    } catch (e) {
        res.status(500).json({"error": e.toString()});
    }
});

app.post("/destroy", async (req, res) => {
    try {
        const instance = await ganachePool.get(req.body.id);
        await ganachePool.destroy(instance);
        res.json({
            id: instance.id
        })
    } catch (e) {
        res.status(500).json({"error": e.toString()});
    }
})

app.listen(port, () => {
    console.log(`Server running at port: ${port}`)
});