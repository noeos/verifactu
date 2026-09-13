import http from "node:http";
import https from "node:https";
import net from "node:net";
import tls from "node:tls";

const deny = (operation) => {
  throw new Error(`UNDECLARED_NETWORK: ${operation} is denied by the canonical task contract`);
};

globalThis.fetch = () =>
  Promise.reject(new Error("UNDECLARED_NETWORK: fetch is denied by the canonical task contract"));
http.request = () => deny("http.request");
http.get = () => deny("http.get");
https.request = () => deny("https.request");
https.get = () => deny("https.get");
net.connect = () => deny("net.connect");
net.createConnection = () => deny("net.createConnection");
tls.connect = () => deny("tls.connect");
