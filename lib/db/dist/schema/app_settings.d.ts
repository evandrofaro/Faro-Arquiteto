import { z } from "zod/v4";
export declare const appSettingsTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "app_settings";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "app_settings";
            dataType: "number";
            columnType: "PgSerial";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        defaultModel: import("drizzle-orm/pg-core").PgColumn<{
            name: "default_model";
            tableName: "app_settings";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        huggingfaceToken: import("drizzle-orm/pg-core").PgColumn<{
            name: "huggingface_token";
            tableName: "app_settings";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        systemPrompt: import("drizzle-orm/pg-core").PgColumn<{
            name: "system_prompt";
            tableName: "app_settings";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
export declare const insertAppSettingsSchema: z.ZodObject<{
    defaultModel: z.ZodOptional<z.ZodString>;
    huggingfaceToken: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    systemPrompt: z.ZodOptional<z.ZodString>;
}, {
    out: {};
    in: {};
}>;
export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;
export type AppSettings = typeof appSettingsTable.$inferSelect;
//# sourceMappingURL=app_settings.d.ts.map