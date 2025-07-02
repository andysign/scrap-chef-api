import { Injectable, Inject } from "@nestjs/common";
import { Database } from "sqlite3";
// import { parseCsv } from "./utils";

// const initialProductionData = `
// Year 	, Month 	, Grade   	, Batches 	
// 2024 	, 6     	, B500A   	, 119     	
// 2024 	, 6     	, A36     	, 9       	
// 2024 	, 6     	, C35     	, 4       	
// 2024 	, 6     	, A53/A53 	, 4       	
// 2024 	, 7     	, B500A   	, 119     	
// 2024 	, 7     	, A36     	, 9       	
// 2024 	, 7     	, C35     	, 4       	
// 2024 	, 7     	, A53/A53 	, 4       	
// 2024 	, 8     	, B500A   	, 1       	
// 2024 	, 8     	, A36     	, 5       	
// 2024 	, 8     	, C35     	, 3       	
// 2024 	, 8     	, A53/A53 	, 5       	
// `;

// const initialGroupsData = `
// Grade    	, Group 	
// B500A    	, Rebar 	
// A36      	, MBQ   	
// C35      	, SBQ   	
// C40      	, SBQ   	
// A53/A543 	, CHQ   	
// `;

@Injectable()
export class AppService {
  constructor(@Inject("DATABASE_CONNECTION") private db: Database) {
    // this.initDatabase();
  }
}
