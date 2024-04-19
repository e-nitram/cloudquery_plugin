const axios = require('axios');
const mysql = require('mysql2/promise');

// Configuration for your MySQL database
const mysqlConfig = {
  host: 'localhost',
  user: 'root',
  password: 'cve',
  database: 'cvedatabase',
  port: 3306,
};

export async function openDb() {
  return mysql.createConnection(mysqlConfig);
}

export async function downloadCVEData() {
  try {
    const response = await axios.get(
      'https://services.nvd.nist.gov/rest/json/cves/2.0'
    );
    return response.data.vulnerabilities || [];
  } catch (error) {
    console.error('Failed to download CVE data:', error);
    throw error;
  }
}

export async function updateLocalDatabase(connection: any, cveDataArray: any) {
  try {
    await connection.beginTransaction();
    for (const cveData of cveDataArray) {
      const { cve } = cveData;
      const cveId = cve?.id || null;
      console.log(cveId)
      const description = cve?.descriptions[0]?.value || null;
      const lastModified = cve?.lastModified || null;

      const [rows] = await connection.execute('SELECT * FROM cvetable WHERE cve_id = ?', [cveId]);
      if (rows.length > 0) {
        await connection.execute(
          'UPDATE cvetable SET description = ?, last_modified = ?, last_touched = CURRENT_TIMESTAMP WHERE cve_id = ?',
          [description, lastModified, cveId]
        );
      } else {
        await connection.execute(
          'INSERT INTO cvetable (cve_id, description, last_modified, last_touched) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
          [cveId, description, lastModified]
        );
      }
    }
    await connection.commit();
  } catch (error) {
    console.error('Database operation failed', error);
    await connection.rollback();
  }
}

export async function main() {
  let connection;
  try {
    connection = await openDb();
    const cves = await downloadCVEData();
    await updateLocalDatabase(connection, cves);
    console.log('CVE data updated successfully.');
  } catch (error) {
    console.error('Error during CVE data update:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

main();
