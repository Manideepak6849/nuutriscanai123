import { setGlobalOptions } from "firebase-functions";
import { onRequest } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import { getProductByBarcode } from "./services/openFoodFacts";
import { scrapeGroceryProduct } from "./services/groceryScraper";
import { scrapeCosmeticsProduct } from "./services/cosmeticsScraper";
import { scrapeHealthProduct } from "./services/healthScraper";

admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({ maxInstances: 10 });

export const getProductData = onRequest(async (request, response) => {
    // Handle CORS
    response.set('Access-Control-Allow-Origin', '*');
    if (request.method === 'OPTIONS') {
        response.set('Access-Control-Allow-Methods', 'GET');
        response.set('Access-Control-Allow-Headers', 'Content-Type');
        response.set('Access-Control-Max-Age', '3600');
        response.status(204).send('');
        return;
    }

    try {
        const { query, type, barcode } = request.query;

        if (!query && !barcode) {
            response.status(400).send({ error: 'Missing query or barcode parameter' });
            return;
        }

        let result;

        // Route to appropriate service
        if (barcode) {
            result = await getProductByBarcode(barcode as string);
        } else if (type === 'cosmetics') {
            result = await scrapeCosmeticsProduct(query as string);
        } else if (type === 'health') {
            result = await scrapeHealthProduct(query as string);
        } else {
            // Default to grocery
            result = await scrapeGroceryProduct(query as string);
        }

        // Cache result in Firestore if successful
        if (result.status === 'success') {
            const cacheKey = barcode ? `barcode_${barcode}` : `query_${query}`;
            await db.collection('product_cache').doc(cacheKey as string).set({
                ...result,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        response.status(200).send(result);
    } catch (error) {
        console.error("Error in getProductData:", error);
        response.status(500).send({ error: 'Internal server error' });
    }
});
