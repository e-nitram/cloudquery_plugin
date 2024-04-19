import axios from 'axios';
import { createConnection } from 'typeorm';
import { CVE } from './entity/CVE';

async function fetchAndStoreCVEs(startIndex: number = 0, resultsPerPage: number = 200) {
    await createConnection(); // Establishes database connection
    const url = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
    let continueFetching = true;

    while (continueFetching) {
        const response = await axios.get(url, {
            params: { startIndex, resultsPerPage }
        });
        const cveItems = response.data.vulnerabilities;
        for (const item of cveItems) {
            const cve = new CVE();
            cve.id = item.cve.id;
console.log("hellp", item.cve.id)

            cve.description = item.cve.descriptions[0].value;
            cve.publishedDate = item.published;
            cve.lastModifiedDate = item.lastModified;
            await cve.save();
        }

        if (cveItems.length < resultsPerPage) {
            continueFetching = false;
        } else {
            startIndex += resultsPerPage;
        }
    }
}

fetchAndStoreCVEs().then(() => {
    console.log("CVEs fetched and stored.");
}).catch(error => {
    console.error("Failed to fetch and store CVEs:", error);
});
