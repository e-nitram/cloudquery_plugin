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
exports.main = exports.updateLocalDatabase = exports.downloadCVEData = exports.openDb = void 0;
const axios = require('axios');
const mysql = require('mysql2/promise');
// Configuration for your MySQL database
const mysqlConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cvedatabase'
};
function openDb() {
    return __awaiter(this, void 0, void 0, function* () {
        return mysql.createConnection(mysqlConfig);
    });
}
exports.openDb = openDb;
function downloadCVEData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios.get('https://services.nvd.nist.gov/rest/json/cves/2.0');
            return response.data.vulnerabilities || [];
        }
        catch (error) {
            console.error('Failed to download CVE data:', error);
            throw error;
        }
    });
}
exports.downloadCVEData = downloadCVEData;
function updateLocalDatabase(connection, cveDataArray) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            yield connection.beginTransaction();
            for (const cveData of cveDataArray) {
                const { cve } = cveData;
                const cveId = (cve === null || cve === void 0 ? void 0 : cve.id) || null;
                console.log(cveId);
                const description = ((_a = cve === null || cve === void 0 ? void 0 : cve.descriptions[0]) === null || _a === void 0 ? void 0 : _a.value) || null;
                const lastModified = (cve === null || cve === void 0 ? void 0 : cve.lastModified) || null;
                const [rows] = yield connection.execute('SELECT * FROM cvetable WHERE cve_id = ?', [cveId]);
                if (rows.length > 0) {
                    yield connection.execute('UPDATE cvetable SET description = ?, last_modified = ?, last_touched = CURRENT_TIMESTAMP WHERE cve_id = ?', [description, lastModified, cveId]);
                }
                else {
                    yield connection.execute('INSERT INTO cvetable (cve_id, description, last_modified, last_touched) VALUES (?, ?, ?, CURRENT_TIMESTAMP)', [cveId, description, lastModified]);
                }
            }
            yield connection.commit();
        }
        catch (error) {
            console.error('Database operation failed', error);
            yield connection.rollback();
        }
    });
}
exports.updateLocalDatabase = updateLocalDatabase;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        let connection;
        try {
            connection = yield openDb();
            const cves = yield downloadCVEData();
            yield updateLocalDatabase(connection, cves);
            console.log('CVE data updated successfully.');
        }
        catch (error) {
            console.error('Error during CVE data update:', error);
        }
        finally {
            if (connection) {
                yield connection.end();
            }
        }
    });
}
exports.main = main;
main();
