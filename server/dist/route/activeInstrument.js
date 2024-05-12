"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
const activeInstruments = [];
router.get('/getActiveInstruments', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (activeInstruments.length === 0) {
            const res = yield fetch('https://www.bitmex.com/api/v1/instrument/active');
            const data = yield res.json();
            activeInstruments.push(data);
        }
        res.json(activeInstruments[0].slice(0, 10));
    }
    catch (error) {
        console.error("Error fetching active instruments:", error);
        res.send([]);
    }
}));
router.get('/getSuggestions/:query', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (activeInstruments.length === 0) {
            const res = yield fetch('https://www.bitmex.com/api/v1/instrument/active');
            const data = yield res.json();
            activeInstruments.push(data);
        }
        const filteredSuggestions = (_a = activeInstruments[0]) === null || _a === void 0 ? void 0 : _a.filter((entry) => {
            var _a;
            return (_a = entry === null || entry === void 0 ? void 0 : entry.symbol) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(req.params.query.toLowerCase());
        }).map((entry) => entry.symbol);
        res.json(filteredSuggestions);
    }
    catch (error) {
        console.error("Error fetching active instruments:", error);
        res.send([]);
    }
}));
exports.default = router;
