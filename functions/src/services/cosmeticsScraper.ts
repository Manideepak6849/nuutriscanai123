import axios from 'axios';
import * as cheerio from 'cheerio';

export const scrapeCosmeticsProduct = async (searchQuery: string) => {
    // Basic stub for scraping cosmetics data (e.g., from INCI Decoder or Nykaa)
    try {
        const url = `https://incidecoder.com/search?query=${encodeURIComponent(searchQuery)}`;
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });

        const $ = cheerio.load(response.data);
        
        // Find the first product link
        const firstLink = $('.product-item a').first().attr('href');
        
        if (!firstLink) {
            return { source: 'CosmeticsScraper', status: 'not_found' };
        }

        const productUrl = `https://incidecoder.com${firstLink}`;
        const productResponse = await axios.get(productUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const product$ = cheerio.load(productResponse.data);
        
        const productName = product$('.klaviyo-bis-product-name').text().trim() || searchQuery;
        
        const ingredients: any[] = [];
        product$('.ingred-list-short a').each((i, el) => {
            ingredients.push(product$(el).text().trim());
        });

        return {
            source: 'CosmeticsScraper',
            status: 'success',
            data: {
                productName,
                ingredients,
                url: productUrl
            }
        };
    } catch (error) {
        console.error('Error scraping cosmetics:', error);
        return { source: 'CosmeticsScraper', status: 'error', error: error instanceof Error ? error.message : String(error) };
    }
};
