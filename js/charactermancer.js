import {CharactermancerApp} from "./charactermancer/app/charactermancer-app.js";

const charactermancerApp = new CharactermancerApp();
window.addEventListener("load", () => charactermancerApp.pInit());
globalThis.dbg_charactermancerApp = charactermancerApp;
