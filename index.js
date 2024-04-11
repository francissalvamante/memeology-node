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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadMemeImage = exports.filterMemes = exports.getMemesCount = exports.cache = exports.decrypt = exports.encrypt = exports.fetchMemes = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const mkdirp = require("mkdirp");
dotenv_1.default.config();
const url = process.env.MEME_URL || "";
const fetchMemes = () => __awaiter(void 0, void 0, void 0, function* () {
    const { data } = yield (0, axios_1.default)({ method: "get", url });
    return data.data.memes;
});
exports.fetchMemes = fetchMemes;
const encrypt = (data, key, iv) => {
    const cipher = crypto_1.default.createCipheriv("aes-256-cbc", key, iv);
    let encryptedData = cipher.update(JSON.stringify(data), "utf-8", "hex");
    encryptedData += cipher.final("hex");
    return encryptedData;
};
exports.encrypt = encrypt;
const decrypt = (encryptedData, key, iv) => {
    const decipher = crypto_1.default.createDecipheriv("aes-256-cbc", key, iv);
    let decryptedData = decipher.update(encryptedData, "hex", "utf-8");
    decryptedData += decipher.final("utf-8");
    return JSON.parse(decryptedData);
};
exports.decrypt = decrypt;
const cache = (data, directory, fileName) => __awaiter(void 0, void 0, void 0, function* () {
    const tempDirectory = path_1.default.join(os_1.default.tmpdir(), directory);
    if (fs_1.default.existsSync(tempDirectory)) {
        fs_1.default.writeFileSync(path_1.default.join(tempDirectory, fileName), JSON.stringify(data));
    }
    else {
        fs_1.default.mkdirSync(tempDirectory, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(tempDirectory, fileName), JSON.stringify(data));
    }
    console.log("cached file stored at:", path_1.default.join(tempDirectory, fileName));
});
exports.cache = cache;
const getMemesCount = (data) => {
    return data.length;
};
exports.getMemesCount = getMemesCount;
const filterMemes = (data) => {
    return data.filter((m) => {
        return m.name.toLowerCase().includes("the");
    });
};
exports.filterMemes = filterMemes;
const downloadMemeImage = (directory, memes) => __awaiter(void 0, void 0, void 0, function* () {
    const tempDirectory = path_1.default.join(os_1.default.tmpdir(), directory);
    const randomMeme = memes[Math.floor(Math.random() * memes.length)];
    console.log(path_1.default.join(tempDirectory, "meme.jpg"));
    const response = yield (0, axios_1.default)({
        method: "get",
        responseType: "arraybuffer",
        url: randomMeme.url,
    });
    fs_1.default.writeFileSync(path_1.default.join(tempDirectory, process.env.RANDOM_IMG_FILE_NAME), response.data);
});
exports.downloadMemeImage = downloadMemeImage;
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const { TMP_DIRECTORY, ENCRYPTED_FILE_NAME } = process.env;
    const memes = yield fetchMemes();
    const key = crypto_1.default.randomBytes(32);
    const iv = crypto_1.default.randomBytes(16);
    const encryptedData = encrypt(memes, key, iv);
    /** Save encrypted data to cache */
    yield cache(encryptedData, TMP_DIRECTORY, ENCRYPTED_FILE_NAME);
    let cachedEncrypt = fs_1.default.readFileSync(path_1.default.join(os_1.default.tmpdir(), TMP_DIRECTORY, ENCRYPTED_FILE_NAME), "utf-8");
    cachedEncrypt = cachedEncrypt.slice(1, cachedEncrypt.length - 1);
    const decryptedData = decrypt(cachedEncrypt, key, iv);
    console.log("Total number of memes got", decryptedData.length);
    const filteredMemes = filterMemes(decryptedData);
    console.log("Number of memes with `The` (case insensitive)", filteredMemes.length);
    yield downloadMemeImage(TMP_DIRECTORY, decryptedData);
});
main().catch((err) => console.error("An error has occured", err));
