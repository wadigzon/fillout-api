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
// src/index.ts
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware to parse JSON request bodies
app.use(express_1.default.json());
// Endpoint to fetch filtered responses
app.get('/:formId/filteredResponses', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { formId } = req.params;
        // Define the URL to fetch data from
        const apiUrl = `https://api.fillout.com/v1/api/forms/${formId}/submissions`;
        // Define the headers including Authorization header
        const headers = {
            'Authorization': 'Bearer sk_prod_TfMbARhdgues5AuIosvvdAC9WsA5kXiZlW8HZPaRDlIbCpSpLsXBeZO7dCVZQwHAY3P4VSBPiiC33poZ1tdUj2ljOzdTCCOSpUZ_3912'
        };
        // Parse filterParams if present
        let filters = undefined;
        if (req.query.filters) {
            filters = JSON.parse(req.query.filters);
        }
        // match other query params according to fillout api
        const queryParams = {
            limit: req.query.limit,
            afterDate: req.query.afterDate,
            beforeDate: req.query.beforeDate,
            offset: req.query.offset,
            status: req.query.status,
            includeEditLink: req.query.includeEditLink,
            sort: req.query.sort
        };
        // Fetch data from the API using axios
        const response = yield axios_1.default.get(apiUrl, {
            headers,
            params: queryParams
        });
        // Filter responses based on provided filters
        let filteredResponses = response.data.responses;
        if (filters && filters.length > 0) {
            filteredResponses = filteredResponses.filter((submission) => 
            // if all the conditions of filter are met
            // we include that submission
            filters === null || filters === void 0 ? void 0 : filters.every((filter) => {
                // search that question by id
                const question = submission.questions.find((q) => q.id === filter.id);
                // if that id is not found in the set => we skip that submission
                if (!question)
                    return false;
                // and also match the value condition of the filter
                switch (filter.condition) {
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
            }));
        }
        // Return the filtered responses
        // totalResponse and pageCount refers to the totality of data (regardless of filtering)
        res.json({
            responses: filteredResponses,
            totalResponses: response.data.totalResponses,
            pageCount: response.data.pageCount
        });
    }
    catch (error) {
        // Handle errors
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'An error occurred while fetching data' });
    }
}));
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
exports.default = app;
