// src/index.ts
import express, { Request, Response } from 'express';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

type FilterClauseType = {
    id: string;
    condition: 'equals' | 'does_not_equal' | 'greater_than' | 'less_than';
    value: number | string;
}
type ResponseFiltersType = FilterClauseType[];

// Endpoint to fetch filtered responses
app.get('/:formId/filteredResponses', async (req: Request, res: Response) => {
    try {
        const { formId } = req.params;

        // Define the URL to fetch data from
        const apiUrl = `https://api.fillout.com/v1/api/forms/${formId}/submissions`;

        // Define the headers including Authorization header
        const headers = {
            'Authorization': 'Bearer sk_prod_TfMbARhdgues5AuIosvvdAC9WsA5kXiZlW8HZPaRDlIbCpSpLsXBeZO7dCVZQwHAY3P4VSBPiiC33poZ1tdUj2ljOzdTCCOSpUZ_3912'
        };

        // Parse filterParams if present
        let filters: ResponseFiltersType | undefined = undefined;
        if (req.query.filters) {
            filters = JSON.parse(req.query.filters as string) as ResponseFiltersType;
        }
        // match other query params according to fillout api
        const queryParams: any = {
            limit: req.query.limit, 
            afterDate: req.query.afterDate, 
            beforeDate: req.query.beforeDate, 
            offset: req.query.offset,
            status: req.query.status,
            includeEditLink: req.query.includeEditLink,
            sort: req.query.sort 
        };
        // Fetch data from the API using axios
        const response = await axios.get(apiUrl, {
            headers,
            params: queryParams
        });

        // Filter responses based on provided filters
        let filteredResponses = response.data.responses;
        if (filters && filters.length > 0) {
            filteredResponses = filteredResponses.filter((submission: any) => 
                // if all the conditions of filter are met
                // we include that submission
                filters?.every((filter: FilterClauseType) => {
                    // search that question by id
                    const question = submission.questions.find((q:any) => q.id === filter.id);
                    // if that id is not found in the set => we skip that submission
                    if (!question) return false;
                    // and also match the value condition of the filter
                    switch(filter.condition) {
                        case 'equals': 
                            return question.value === filter.value;
                        case 'does_not_equal':
                            return question.value !== filter.value;
                        case 'greater_than':
                            return question.value > filter.value;
                        case 'less_than':
                            return question.value < filter.value;
                        default:
                            return false;
                    }
                })
            )
        }

        // Return the filtered responses
        // totalResponse and pageCount refers to the totality of data (regardless of filtering)
        res.json({
            responses: filteredResponses,
            totalResponses: response.data.totalResponses,
            pageCount: response.data.pageCount
        });
    } catch (error) {
        // Handle errors
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'An error occurred while fetching data' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
