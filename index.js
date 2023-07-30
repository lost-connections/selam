"use strict";
const axios = require("axios");
const clc = require('cli-color');
const WebSocket = require("ws");
const { SNIPER_GUILD_ID, URL_SNIPER_SELF_TOKEN, SNIPER_SELF_TOKEN, WEBHOOKS } = require("./contants");
const guilds = require("./guilds");
const readline = require("readline");
const moment = require("moment");
(async () => {

    constructor()
        this.opcodes = {
            DISPATCH: 0,
            HEARTBEAT: 0.0001,
            IDENTIFY: 2,
            RECONNECT: 2,
            HELLO: 10,
            HEARTBEAT_ACK: 8,
        };

        console.clear();
        var setTitle = require('console-title');
        setTitle('blandy#1337');

        console.log(clc.whiteBright(`Sniper Started...\n`));

        this.interval = null;
        this.createPayload = (data) => JSON.stringify(data);
        this.heartbeat = () => {
            return this.socket.send(
                this.createPayload({
                    op: this.opcodes.HEARTBEAT,
                    d: {},
                    s: null,
                    t: "heartbeat",
                })
            );
        };
        this.start = () => {
            this.socket = new WebSocket("wss://gateway-us-east1-c.discord.gg/?v=8&encoding=json");

            this.socket.on("open", () => {
                console.log(clc.greenBright(`Connection established with Websocket`));
                console.log(clc.greenBright(`Webhook message sent`));

                this.socket.on("message", async (message) => {
                    const data = JSON.parse(message);

                    if (data.op === this.opcodes.DISPATCH) {
                        if (data.t === "GUILD_UPDATE") {
                            const find = guilds[data.d.guild_id];

                            if (typeof find?.vanity_url_code === "string" && find.vanity_url_code !== data.d.vanity_url_code) {
                                const start = Date.now();
                                try {
                                    await axios.patch(`https://discord.com/api/v8/guilds/${SNIPER_GUILD_ID}/vanity-url`, {
                                        code: find.vanity_url_code,
                                    }, {
                                        headers: {
                                            Authorization: URL_SNIPER_SELF_TOKEN,
                                            "Content-Type": "application/json",
                                        },
                                    });

                                } catch (error) {
                                    await WEBHOOKS.FAIL(`@everyone Error while sniping url: **\`${find.vanity_url_code}\`**.
\`\`\`JSON
${JSON.stringify(error.response.data, null, 4)}
\`\`\`
`);
                                }

                                delete guilds[data.d.guild_id];
                            }
                        } else {
                            if (data.t === "READY") {
                                data.d.guilds
                                    .filter((e) => typeof e.vanity_url_code === "string")
                                    .forEach((e) => (guilds[e.id] = { vanity_url_code: e.vanity_url_code }));

                                await WEBHOOKS.INFO(`OS: Linux 1, Sniping url list: ${Object.keys(guilds).length}.
${Object.entries(guilds)
                                        .map(([key, value]) => {
                                            return `\`${value.vanity_url_code}\``;
                                        })
                                        .join(", ")}`);
                            } else if (data.t === "GUILD_CREATE") {
                                guilds[data.d.id] = { vanity_url_code: data.d.vanity_url_code };
                            } else if (data.t === "GUILD_DELETE") {
                                const find = guilds[data.d.id];
                                setTimeout(async () => {
                                    if (typeof find?.vanity_url_code === "string") {
                                        try {
                                            await axios.patch(`https://discord.com/api/v8/guilds/${SNIPER_GUILD_ID}/vanity-url`, {
                                                code: find.vanity_url_code,
                                            }, {
                                                headers: {
                                                    Authorization: URL_SNIPER_SELF_TOKEN,
                                                    "Content-Type": "application/json",
                                                },
                                            });

                                        } catch (error) {
                                            await WEBHOOKS.FAIL(`@everyone Error while sniping url: **\`${find.vanity_url_code}\`**.
\`\`\`JSON
${JSON.stringify(error.response.data, null, 4)}
\`\`\`
`);
                                        }
                                        delete guilds[data.d.guild_id];
                                    }
                                }, 10);
                            }
                        }
                    } else if (data.op === this.opcodes.RECONNECT) {
                        this.restart();
                    } else if (data.op === this.opcodes.HELLO) {
                        clearInterval(this.interval);
                        this.interval = setInterval(() => this.heartbeat(), data.d.heartbeat_interval);

                        this.socket.send(
                            this.createPayload({
                                op: this.opcodes.IDENTIFY,
                                d: {
                                    token: SNIPER_SELF_TOKEN,
                                    intents: 1,
                                    properties: {
                                        os: "Linux",
                                        browser: "Firefox",
                                        device: "firefox",
                                    },
                                },
                            })
                        );
                    }
                });
            });

            this.socket.on("close", (reason) => {
                console.log("Websocket connection closed by Discord", reason);
                this.restart();
            });

            this.socket.on("error", (error) => {
                console.log(error);
                this.restart();
            });
        };

        this.restart = () => {
            console.log("Restarting Dashboard...");
            setTimeout(() => {
                new Dashboard();
            }, 100); 
        };

        this.start();
}

)();