import { describe, it, expect } from "vitest";
import { getSupplierTheme, SUPPLIER_TOKENS } from "../src/lib/supplier-tokens";
import {
  FlightMetadataSchema,
  TransferMetadataSchema,
  InsuranceMetadataSchema,
  CarRentalMetadataSchema,
  ParkMetadataSchema,
} from "../src/lib/multiproduct-schemas";
import { sanitizeSafeUrl } from "../src/lib/proposal-service";

describe("Travel Quote Builder & Validation Gate Tests", () => {
  describe("Supplier Design Tokens", () => {
    it("returns Booking.com blue token", () => {
      const theme = getSupplierTheme("Booking.com Quarto Standard");
      expect(theme.accentColor).toBe("#003580");
      expect(theme.badgeClass).toContain("bg-blue-50");
    });

    it("returns BestBuy orange token", () => {
      const theme = getSupplierTheme("BestBuy Travel Tarifa Especial");
      expect(theme.accentColor).toBe("#FF6B00");
      expect(theme.badgeClass).toContain("bg-orange-50");
    });

    it("returns Interep green token", () => {
      const theme = getSupplierTheme("Interep Operadora");
      expect(theme.accentColor).toBe("#2D5A27");
      expect(theme.badgeClass).toContain("bg-emerald-50");
    });

    it("falls back to neutral token for unknown suppliers", () => {
      const theme = getSupplierTheme("Operadora Desconhecida");
      expect(theme.accentColor).toBe("#475569");
      expect(theme.badgeClass).toContain("bg-slate-100");
    });
  });

  describe("Security & URL Sanitization", () => {
    it("accepts valid https and http URLs", () => {
      expect(sanitizeSafeUrl("https://www.fixtur.com.br")).toBe("https://www.fixtur.com.br");
      expect(sanitizeSafeUrl("http://hotel.com")).toBe("http://hotel.com");
    });

    it("blocks unsafe schemes like javascript:, data:, file:", () => {
      expect(sanitizeSafeUrl("javascript:alert(1)")).toBeNull();
      expect(sanitizeSafeUrl("data:text/html,hack")).toBeNull();
      expect(sanitizeSafeUrl("file:///etc/passwd")).toBeNull();
      expect(sanitizeSafeUrl("")).toBeNull();
      expect(sanitizeSafeUrl(null)).toBeNull();
      expect(sanitizeSafeUrl(undefined)).toBeNull();
    });
  });

  describe("Multiproduct Metadata Schemas (Zod)", () => {
    it("validates Flight metadata schema", () => {
      const validFlight = {
        origin: "GRU",
        destination: "MCO",
        airline: "LATAM",
        flight_number: "LA8186",
        baggage_type: "checked" as const,
        class_type: "economy" as const,
      };
      const result = FlightMetadataSchema.safeParse(validFlight);
      expect(result.success).toBe(true);
    });

    it("validates Transfer metadata schema", () => {
      const validTransfer = {
        company: "Orlando VIP Transfers",
        vehicle_type: "Van Executiva",
        is_private: true,
        origin: "Aeroporto MCO",
        destination: "Monreale Hotel",
      };
      const result = TransferMetadataSchema.safeParse(validTransfer);
      expect(result.success).toBe(true);
    });

    it("validates Insurance metadata schema", () => {
      const validInsurance = {
        insurer: "GTA",
        plan_name: "Euro Max",
        coverage_summary: "USD 75.000 Despesas Médicas",
        travelers_count: 4,
        terms_url: "https://gta.com.br/termos",
      };
      const result = InsuranceMetadataSchema.safeParse(validInsurance);
      expect(result.success).toBe(true);
    });

    it("validates Car Rental metadata schema", () => {
      const validCar = {
        rental_company: "Alamo",
        category: "SUV Intermediário",
        car_model_reference: "Toyota RAV4",
        is_similar: true,
        transmission: "automatic" as const,
        insurance_included: true,
      };
      const result = CarRentalMetadataSchema.safeParse(validCar);
      expect(result.success).toBe(true);
    });

    it("validates Park metadata schema", () => {
      const validPark = {
        complex_name: "Walt Disney World",
        product_name: "4-Day Theme Park Ticket with Park Hopper",
        days_count: 4,
        tickets_count: 2,
        category: "Park Hopper",
      };
      const result = ParkMetadataSchema.safeParse(validPark);
      expect(result.success).toBe(true);
    });
  });
});
