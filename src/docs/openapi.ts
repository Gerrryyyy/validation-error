
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  createStallSchema,
  idParamSchema,
  stallQuerySchema,
  updateStallSchema,
} from "../schemas/stallSchema.ts";

const registry = new OpenAPIRegistry();

// ================================================================
// PART 1: SCHEMAS
// ================================================================

// Response schema for one stall.
const stallSchema = registry.register(
  "Stall",
  z.object({
    id: z.number().openapi({ example: 1 }),
    ownerId: z.number().openapi({ example: 2 }),
    name: z.string().openapi({ example: "Warung Bu Tini" }),
    category: z.string().nullable().openapi({ example: "Kwetiau" }),
    location: z.string().nullable().openapi({ example: "Kantin FKIP" }),
    description: z
      .string()
      .nullable()
      .openapi({ example: "Kedai kwetiau goreng & kuah" }),
    avgRating: z.number().openapi({ example: 4.5 }),
    reviewCount: z.number().openapi({ example: 2 }),
    isPopular: z.boolean().openapi({ example: false }),
  }),
);

// Response schema for a menu.
const menuSchema = registry.register(
  "Menu",
  z.object({
    id: z.number().openapi({ example: 1 }),
    stallId: z.number().openapi({ example: 2 }),
    name: z.string().openapi({ example: "Kwetiau Goreng Spesial" }),
    price: z.number().openapi({ example: 15000 }),
    isAvailable: z.boolean().openapi({ example: true }),
  }),
);

// Standard error response.
const errorSchema = registry.register(
  "ErrorResponse",
  z.object({
    status: z.string().openapi({ example: "fail" }),
    message: z.string().openapi({ example: "Validasi gagal" }),
    errors: z
      .array(
        z.object({
          field: z.string(),
          message: z.string(),
        }),
      )
      .optional()
      .openapi({
        example: [
          {
            field: "name",
            message: "name minimal 3 karakter",
          },
        ],
      }),
  }),
);

// Register the same schemas used by the validation middleware.
const stallInput = registry.register(
  "StallInput",
  createStallSchema,
);

const stallUpdate = registry.register(
  "StallUpdate",
  updateStallSchema,
);

// Response containing a list of stalls and pagination metadata.
const stallListResponse = registry.register(
  "StallListResponse",
  z.object({
    status: z.literal("success"),
    meta: z.object({
      page: z.number().openapi({ example: 1 }),
      limit: z.number().openapi({ example: 10 }),
      total: z.number().openapi({ example: 10 }),
    }),
    data: z.array(stallSchema),
  }),
);

// Response containing one stall.
const stallDetailResponse = registry.register(
  "StallDetailResponse",
  z.object({
    status: z.literal("success"),
    data: stallSchema,
  }),
);

// Response containing a list of menus.
const menuListResponse = registry.register(
  "MenuListResponse",
  z.object({
    status: z.literal("success"),
    data: z.array(menuSchema),
  }),
);

// ================================================================
// PART 2: API ENDPOINTS
// ================================================================

// GET /health
registry.registerPath({
  method: "get",
  path: "/health",
  summary: "Cek kesehatan server & database",
  responses: {
    200: {
      description: "Server dan database terhubung",
      content: {
        "application/json": {
          schema: z.object({
            status: z.literal("success"),
            message: z.string(),
          }),
        },
      },
    },
    500: {
      description: "Kesalahan pada server",
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
    },
  },
});

// GET /api/v1/stalls
registry.registerPath({
  method: "get",
  path: "/api/v1/stalls",
  summary: "Daftar warung",
  description:
    "Daftar warung dengan filter search/category dan pagination.",
  request: {
    query: stallQuerySchema,
  },
  responses: {
    200: {
      description: "Daftar warung + meta pagination",
      content: {
        "application/json": {
          schema: stallListResponse,
        },
      },
    },
    400: {
      description: "Query parameter tidak valid",
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
    },
    500: {
      description: "Kesalahan pada server",
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
    },
  },
});

// POST /api/v1/stalls
registry.registerPath({
  method: "post",
  path: "/api/v1/stalls",
  summary: "Tambah warung",
  request: {
    body: {
      description: "Data warung baru",
      content: {
        "application/json": {
          schema: stallInput,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Warung berhasil dibuat",
      content: {
        "application/json": {
          schema: stallDetailResponse,
        },
      },
    },
    400: {
      description: "Body tidak valid",
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
    },
    409: {
      description: "Data bentrok dengan data yang sudah ada",
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
    },
    500: {
      description: "Kesalahan pada server",
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
    },
  },
});

// GET /api/v1/stalls/{id}
registry.registerPath({
  method: "get",
  path: "/api/v1/stalls/{id}",
  summary: "Detail warung",
  request: {
    params: idParamSchema,
  },
  responses: {
    200: {
      description: "Detail warung",
      content: {
        "application/json": {
          schema: stallDetailResponse,
        },
      },
    },
    400: {
      description: "Parameter id tidak valid",
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
    },
    404: {
      description: "Warung tidak ditemukan",
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
    },
    500: {
      description: "Kesalahan pada server",
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
    },
  },
});

// PUT /api/v1/stalls/{id}
registry.registerPath({
  method: "put",
  path: "/api/v1/stalls/{id}",
  summary: "Update warung",
  request: {
    params: idParamSchema,
    body: {
      description: "Data warung yang diubah (boleh sebagian)",
      content: {
        "application/json": {
          schema: stallUpdate,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Warung ter-update",
      content: {
        "application/json": {
          schema: stallDetailResponse,
        },
      },
    },
    400: {
      description: "Body/parameter tidak valid",
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
    },
    404: {
      description: "Warung tidak ditemukan",
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
    },
    409: {
      description: "Data bentrok dengan data yang sudah ada",
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
    },
    500: {
      description: "Kesalahan pada server",
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
    },
  },
});

// DELETE /api/v1/stalls/{id}
registry.registerPath({
  method: "delete",
  path: "/api/v1/stalls/{id}",
  summary: "Hapus warung",
  request: {
    params: idParamSchema,
  },
  responses: {
    200: {
      description: "Warung terhapus",
      content: {
        "application/json": {
          schema: stallDetailResponse,
        },
      },
    },
    404: {
      description: "Warung tidak ditemukan",
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
    },
    500: {
      description: "Kesalahan pada server",
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
    },
  },
});

// GET /api/v1/stalls/{id}/menus
registry.registerPath({
  method: "get",
  path: "/api/v1/stalls/{id}/menus",
  summary: "Daftar menu sebuah warung",
  request: {
    params: idParamSchema,
  },
  responses: {
    200: {
      description: "Daftar menu milik warung",
      content: {
        "application/json": {
          schema: menuListResponse,
        },
      },
    },
    404: {
      description: "Warung tidak ditemukan",
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
    },
    500: {
      description: "Kesalahan pada server",
      content: {
        "application/json": {
          schema: errorSchema,
        },
      },
    },
  },
});

// ================================================================
// PART 3: GENERATE THE OPENAPI DOCUMENT
// ================================================================

const generator = new OpenApiGeneratorV3(registry.definitions);

export const openApiDocument = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "Review Kantin API",
    version: "1.0.0",
    description:
      "Dokumentasi OpenAPI 3.0 yang dibangkitkan otomatis dari schema zod " +
      "(@asteasolutions/zod-to-openapi) — satu sumber kebenaran untuk validasi dan dokumentasi.",
  },
  servers: [{ url: "http://localhost:3000" }],
});
