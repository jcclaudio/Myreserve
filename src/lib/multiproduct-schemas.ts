import { z } from "zod";

export type ProductType =
  | "HOTEL"
  | "FLIGHT"
  | "TRANSFER"
  | "TICKET"
  | "TOUR"
  | "TRAVEL_INSURANCE"
  | "CAR_RENTAL"
  | "PARK"
  | "CUSTOM_SERVICE";

export const PRODUCT_TYPES: { type: ProductType; label: string; icon: string }[] = [
  { type: "FLIGHT", label: "Aéreo", icon: "Plane" },
  { type: "TRANSFER", label: "Transfer", icon: "Car" },
  { type: "TICKET", label: "Ingressos", icon: "Ticket" },
  { type: "TOUR", label: "Passeios & Tours", icon: "Compass" },
  { type: "TRAVEL_INSURANCE", label: "Seguro Viagem", icon: "Shield" },
  { type: "CAR_RENTAL", label: "Locação de Carro", icon: "Key" },
  { type: "PARK", label: "Parques Temáticos", icon: "Sparkles" },
  { type: "CUSTOM_SERVICE", label: "Outros Serviços", icon: "Layers" },
];

export const FlightMetadataSchema = z.object({
  origin: z.string().optional(),
  destination: z.string().optional(),
  airline: z.string().optional(),
  flight_number: z.string().optional(),
  departure_time: z.string().optional(),
  arrival_time: z.string().optional(),
  baggage_type: z.enum(["none", "hand_only", "checked", "multiple"]).optional(),
  baggage_description: z.string().optional(),
  class_type: z.enum(["economy", "premium_economy", "business", "first"]).optional(),
  stops_count: z.number().int().min(0).optional(),
});

export const TransferMetadataSchema = z.object({
  company: z.string().optional(),
  vehicle_type: z.string().optional(),
  is_private: z.boolean().default(true),
  origin: z.string().optional(),
  destination: z.string().optional(),
  special_instructions: z.string().optional(),
});

export const InsuranceMetadataSchema = z.object({
  insurer: z.string().optional(),
  plan_name: z.string().optional(),
  coverage_summary: z.string().optional(),
  travelers_count: z.number().int().min(1).default(1),
  terms_url: z.string().url().optional().or(z.literal("")),
});

export const CarRentalMetadataSchema = z.object({
  rental_company: z.string().optional(),
  category: z.string().optional(),
  car_model_reference: z.string().optional(),
  is_similar: z.boolean().default(true),
  pickup_location: z.string().optional(),
  dropoff_location: z.string().optional(),
  pickup_date: z.string().optional(),
  dropoff_date: z.string().optional(),
  transmission: z.enum(["manual", "automatic"]).optional(),
  capacity_passengers: z.number().int().min(1).optional(),
  capacity_bags: z.number().int().min(0).optional(),
  insurance_included: z.boolean().default(true),
});

export const ParkMetadataSchema = z.object({
  complex_name: z.string().optional(),
  product_name: z.string().optional(),
  days_count: z.number().int().min(1).optional(),
  tickets_count: z.number().int().min(1).default(1),
  category: z.string().optional(),
});

export const TicketMetadataSchema = z.object({
  category: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
  valid_until: z.string().optional(),
});

export const TourMetadataSchema = z.object({
  company: z.string().optional(),
  duration: z.string().optional(),
  includes: z.string().optional(),
  excludes: z.string().optional(),
});

export const CustomServiceMetadataSchema = z.object({
  category: z.string().optional(),
  provider: z.string().optional(),
});
