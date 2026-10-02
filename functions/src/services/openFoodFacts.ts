import axios from 'axios';

const BASE_URL = 'https://world.openfoodfacts.org/api/v2';

export const getProductByBarcode = async (barcode: string) => {
    try {
        const response = await axios.get(`${BASE_URL}/product/${barcode}.json`);
        if (response.data && response.data.status === 1) {
            return {
                source: 'OpenFoodFacts',
                status: 'success',
                data: {
                    productName: response.data.product.product_name,
                    brands: response.data.product.brands,
                    ingredients: response.data.product.ingredients_text,
                    nutritionGrades: response.data.product.nutrition_grades,
                    nutriments: response.data.product.nutriments,
                    image: response.data.product.image_url,
                }
            };
        }
        return { source: 'OpenFoodFacts', status: 'not_found' };
    } catch (error) {
        console.error('Error fetching from OpenFoodFacts:', error);
        return { source: 'OpenFoodFacts', status: 'error', error: error instanceof Error ? error.message : String(error) };
    }
};
