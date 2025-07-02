const express = require('express');

const app = express();
app.use(express.json());

const initialProductionData = `
Year 	, Month 	, Grade   	, Batches 	
2024 	, 6     	, B500A   	, 119     	
2024 	, 6     	, A36     	, 9       	
2024 	, 6     	, C35     	, 4       	
2024 	, 6     	, A53/A53 	, 4       	
2024 	, 7     	, B500A   	, 119     	
2024 	, 7     	, A36     	, 9       	
2024 	, 7     	, C35     	, 4       	
2024 	, 7     	, A53/A53 	, 4       	
2024 	, 8     	, B500A   	, 1       	
2024 	, 8     	, A36     	, 5       	
2024 	, 8     	, C35     	, 3       	
2024 	, 8     	, A53/A53 	, 5       	
`;

const port = 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
